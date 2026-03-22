import re
from time import time

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

# progress = 0
progress_store = {}


def get_progress():
    return progress


EMAIL_REGEX = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"


def clean_emails(emails):

    clean = []

    for e in emails:
        e = e.lower()

        # ❌ reject JS / version garbage
        if any(x in e for x in ["@", ".js", ".css"]):
            pass

        # ❌ reject version patterns like @4.1.4
        if re.search(r"@\d+\.\d+", e):
            continue

        # ❌ reject weird domains
        domain = e.split("@")[-1]
        if not "." in domain:
            continue

        # ❌ reject long garbage strings
        if len(e) > 40:
            continue

        clean.append(e)

    return list(set(clean))


API_URL = "https://router.huggingface.co/v1/chat/completions"
HEADERS = {
    "Authorization": "Bearer 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",
    "Content-Type": "application/json",
}


def ai_insights(lead):
    prompt = f"""
    You analyze business leads for sales outreach.

    Data:
    Reviews: {lead["reviews"]}
    Website: {lead["website"]}
    Instagram: {lead["social"].get("instagram")}

    Rules:
    - Be blunt and practical
    - No generic words like "great", "excellent"
    - Focus on opportunity or problem
    - Max 10 words

    Examples:
    "High rating but no website → strong opportunity"
    "No Instagram → poor online presence"
    "Everything present → low priority lead"

    Now give ONLY one short insight:
    """

    payload = {
        "model": "meta-llama/Meta-Llama-3-8B-Instruct",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 60,
    }

    res = requests.post(API_URL, headers=HEADERS, json=payload)

    try:
        return res.json()["choices"][0]["message"]["content"].strip()
    except:
        return "No insight"


def get_social(data):
    socials = {
        "instagram": None,
        "facebook": None,
        "twitter": None,
        "linkedin": None,
        "youtube": None,
        "whatsapp": None,
    }

    try:
        soup = BeautifulSoup(data, "html.parser")

        for a in soup.find_all("a", href=True):
            link = a["href"].lower()

            if "instagram.com" in link:
                socials["instagram"] = link

            elif "facebook.com" in link:
                socials["facebook"] = link

            elif "twitter.com" in link or "x.com" in link:
                socials["twitter"] = link

            elif "linkedin.com" in link:
                socials["linkedin"] = link

            elif "youtube.com" in link:
                socials["youtube"] = link

            elif "wa.me" in link or "whatsapp.com" in link:
                socials["whatsapp"] = link

    except:
        pass

    return socials


def score_lead(lead):
    score = 0
    tags = []

    # ⭐ Reviews
    try:
        if lead["reviews"] and float(lead["reviews"]) >= 4.5:
            score += 2
    except:
        pass

    # 🌐 No website = opportunity
    if not lead["website"] or lead["website"] in ["None", "-"]:
        score += 3
        tags.append("❌ No Website")

    # 📷 No Instagram
    if not lead["social"] or not lead["social"].get("instagram"):
        score += 2
        tags.append("❌ No Instagram")

    # ⚡ Slow website
    if lead["speed"] == "🔴 Slow":
        score += 1
        tags.append("⚠️ Slow Site")

    # 📧 Has email (bonus)
    if lead["emails"] and lead["emails"] != "-":
        score += 1

    # 🎯 Final label
    if score >= 5:
        level = "🔥 High"
    elif score >= 3:
        level = "⚡ Medium"
    else:
        level = "❌ Low"

    return level, tags


def extract_emails_deep(url):

    emails = set()

    try:
        # main page
        r = requests.get(url, timeout=5)
        socials = get_social(r.text)
        print("NIGGAAAA")
        print(socials)
        emails.update(re.findall(EMAIL_REGEX, r.text))

        for path in ["/contact", "/contact-us", "/about"]:
            try:
                r = requests.get(url + path, timeout=3)
                emails.update(re.findall(EMAIL_REGEX, r.text))
            except:
                continue

    except:
        return [], {}

    return clean_emails(list(emails)), socials


def data_extractor(area, place, limit, task_id):
    progress_store[task_id] = 0
    limit = int(limit)
    results = []
    df = area.split(" ")
    df.append("in")
    df.append(place)
    quesy = "+".join(df)
    print(quesy)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        page = browser.new_page()
        page.goto(f"https://www.google.com/maps/search/{quesy}/")

        print(page.title())
        print(page.url)

        try:
            page.wait_for_selector(".hfpxzc", timeout=1000)
            print("Results loaded!")
        except:
            print("No results or timeout – maybe blocked / wrong selector")

        cards = page.locator(".hfpxzc")
        feed = page.locator('div[role="feed"]')

        processed = 0
        print("limit = ", limit)
        while True:
            if processed >= limit:
                break

            count = cards.count()

            while processed < count:
                if processed >= limit:
                    return results
                progress_store[task_id] += 1
                card = cards.nth(processed)

                name = card.get_attribute("aria-label")
                if not name:
                    continue
                print("***********************")
                print(name)

                card.click()
                page.wait_for_selector("h1.DUwDvf")
                phone = None
                try:
                    page.wait_for_selector('[data-item-id^="phone:tel:"]', timeout=1000)
                    phone_elem = page.query_selector(
                        '[data-item-id^="phone:tel:"] .Io6YTe'
                    )  # or .fontBodyMedium.kR99db

                    if phone_elem:
                        phone = phone_elem.inner_text().strip()
                        print("Phone number found:", phone)
                    else:
                        # Fallback: search for aria-label containing "Phone"
                        phone_button = page.query_selector('[aria-label*="Phone:"]')
                        if phone_button:
                            phone = (
                                phone_button.get_attribute("aria-label")
                                .replace("Phone: ", "")
                                .strip()
                            )
                            print("Phone: ", phone)
                except:
                    print(
                        "Phone not found in details panel – try clicking 'Show number' if hidden."
                    )
                website = None
                try:
                    # Wait for website link (data-item-id="authority" or similar)
                    page.wait_for_selector('[data-item-id="authority"]', timeout=1000)

                    website_elem = page.query_selector(
                        '[data-item-id="authority"] a'
                    )  # the <a> tag
                    if website_elem:
                        website_url = website_elem.get_attribute("href")
                        website_text = website_elem.inner_text().strip()
                        website = website_text
                        print("Website found:", website_url, f"({website_text})")

                    # Fallback: aria-label or text search
                    else:
                        website_link = page.query_selector('[aria-label*="Website:"]')
                        if website_link:
                            url = (
                                website_link.get_attribute("href")
                                or website_link.inner_text().strip()
                            )
                            print("Website :", url)
                            website = url

                except:
                    print(
                        "Website not visible – might be in footer or contact section."
                    )
                    # Broader search for http/https links in panel
                reviews = None
                try:
                    page.wait_for_selector(".F7nice", timeout=1000)
                    phone_elem = page.query_selector(
                        ".F7nice"
                    )  # or .fontBodyMedium.kR99db

                    if phone_elem:
                        reviews = phone_elem.inner_text().strip()
                        print("reviews:", reviews)

                except:
                    print("rewviews not found.")

                try:
                    page.wait_for_selector('[data-item-id="address"]', timeout=2000)

                    address_elem = page.query_selector(
                        '[data-item-id="address"] .Io6YTe'
                    )

                    if address_elem:
                        address = address_elem.inner_text().strip()
                    else:
                        address = None

                except:
                    address = None

                if website is not None:
                    status, speed, email, socials = website_scanner(website)
                else:
                    status = "-"
                    speed = "-"
                    email = "-"
                    socials = {
                        "instagram": None,
                        "facebook": None,
                        "twitter": None,
                        "linkedin": None,
                        "youtube": None,
                        "whatsapp": None,
                    }

                business = {
                    "name": name,
                    "phone": phone,
                    "emails": email,
                    # "Location":location,
                    "website": website,
                    "status": status,
                    "reviews": reviews,
                    "speed": speed,
                    "social": socials,
                    "address": address,
                }
                score, tags = score_lead(business)

                business["score"] = score
                business["tags"] = tags
                results.append(business)
                processed += 1

            # scroll for more businesses
            feed.evaluate("el => el.scrollBy(0, 1000)")
            page.wait_for_timeout(1000)

            new_count = cards.count()

            # stop if nothing new loads
            if new_count == count:
                break

        print(results)
        # input("Press enter to finish extracting")
        browser.close()
        return results


def social_check(url):

    socials = [
        "facebook.com",
        "instagram.com",
        "twitter.com",
        "x.com",
        "linkedin.com",
        "youtube.com",
        "tiktok.com",
        "wa.me",
        "whatsapp.com",
        "telegram.me",
    ]

    if not url:
        return None

    for social in socials:
        if social in url.lower():
            return social

    return None


def website_scanner(web):

    headers = {"User-Agent": "Mozilla/5.0"}
    red = social_check(web)
    if red is not None:
        return (
            red,
            "None",
            "-",
            {
                "instagram": None,
                "facebook": None,
                "twitter": None,
                "linkedin": None,
                "youtube": None,
                "whatsapp": None,
            },
        )
    try:
        start = time()

        r = requests.get(web, headers=headers, timeout=10)

        end = time()

        speed = round(end - start, 2)

        sped_idn = ""
        if speed < 1:
            sped_idn = "🟢 Fast"

        elif speed < 3:
            sped_idn = "🟡 Medium"

        else:
            sped_idn = "🔴 Slow"

        email, socials = extract_emails_deep(web)

        if r.status_code >= 500:
            return "down", sped_idn, email, socials

        if r.status_code == 200:
            return "ok", sped_idn, email, socials

        if 301 <= r.status_code <= 308:
            return "redirect", sped_idn, email, socials

        return "unknown", sped_idn, email, socials

    except requests.exceptions.RequestException:
        return (
            "down",
            "⚫ down",
            "-",
            {
                "instagram": None,
                "facebook": None,
                "twitter": None,
                "linkedin": None,
                "youtube": None,
                "whatsapp": None,
            },
        )
