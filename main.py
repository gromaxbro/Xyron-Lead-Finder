from time import time

import requests
from playwright.sync_api import sync_playwright


def data_extractor(area, place, limit):
    results = []
    df = area.split(" ")
    df.append("in")
    df.append(place)
    quesy = "+".join(df)
    print(quesy)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

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

        while True:
            count = cards.count()

            while processed < count:
                card = cards.nth(processed)
                if processed == limit:
                    break
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

                if website is not None:
                    status, speed = website_scanner(website)
                else:
                    status = None
                    speed = None
                business = {
                    "name": name,
                    "phone": phone,
                    "website": website,
                    "status": status,
                    "reviews": reviews,
                    "speed": speed,
                }
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
        return red, "None"
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

        if r.status_code >= 500:
            return "down", sped_idn

        if r.status_code == 200:
            return "ok", sped_idn

        if 301 <= r.status_code <= 308:
            return "redirect", sped_idn

        return "unknown", sped_idn

    except requests.exceptions.RequestException:
        return "down", "⚫ down"
