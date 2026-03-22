# Xyron Lead Finder Tool
Xyron is a lead finder tool where it uses google map to scrape details about local shops and store. and analyze their online presence for outreach opportunities.
you can use this tool for cold calling or finding broken websites to fix or reach.

<img width="1917" height="1079" alt="Screenshot 2026-03-22 140155" src="https://github.com/user-attachments/assets/4934445e-d708-4003-b287-f6eddf08e5a8" />


## Overview
Lead Finder helps you quickly identify businesses in a specific niche and location, then extracts useful data to evaluate their digital presence.
Instead of manually checking each business, this tool highlights which ones are worth contacting.

## Features

- 🔍 Search businesses by niche + location  
- 📞 Extract phone numbers  
- 💬 Extract emails from websites  
- 🌐 Detect website availability & loading speed  
- 📊 Identify social media presence  
- ⭐ Collect ratings & reviews  
- 📍 Extract business address  
- 🧠 Lead scoring system  
- 🤖 AI-generated insights (optional)


## Example Insights
- High rating but no website → strong opportunity
- No Instagram presence → weak online visibility
- Website + social active → lower priority lead

## Tech Stack
- Backend: Python, Flask
- Scraping: Playwright
- HTTP Requests: requests
- Frontend: HTML, CSS, JavaScript
- AI (optional): Hugging Face / LLM API

## Pages & Routes

| Page Name     | Route          | Description                          |
|---------------|---------------|--------------------------------------|
| Login Page    | `/login-page` | User authentication page             |
| Dashboard     | `/dashboard`  | View and manage extracted leads      |
| Logout     | `/logout`  | View and manage extracted leads      |
| Extract API   | `/extract`    | Start lead extraction (POST)         |
| Progress API  | `/progress`   | Get scraping progress                |
| AI Insight    | `/ai-insight` | Generate AI-based lead insight       |


## How It Works
1. Enter a business type and location
2. The scraper collects relevant businesses
3 . Each lead is analyzed:
- website status
- social presence
- reviews
- A score + insight is generated to prioritize leads



## ▶️ Getting Started
1. Clone the repository
```
 git clone https://github.com/your-username/lead-finder.git
cd lead-finder
```
3. Install dependencies
```
pip install -r requirements.txt
```
5. Change the API KEY(Hugging Face) in the `main.py`
```
API_URL = "https://router.huggingface.co/v1/chat/completions"
API_KEY = ""
```
4. Run the app
```
python app.py
```
6. Open in browser
```
http://127.0.0.1:5000
```

## usage

 - Use `app.py` for the main side
- and `register.py` to register new user
 
## ⚠️ Disclaimer
This is an experimental side project Scraped data may not always be fully accurate
Use responsibly and respect website terms of service


## 📬 Feedback
If you have suggestions or ideas, feel free to share — always looking to improve.

