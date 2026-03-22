import json
import sqlite3

from flask import (
    Flask,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

from main import ai_insights, data_extractor, progress_store

app = Flask(__name__)
app.secret_key = "wasfmegginsiangeindv"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect("database.db")
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(error):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()

    # 👤 users table
    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    # 📊 leads table (linked to user)
    db.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    db.commit()


with app.app_context():
    init_db()


def require_login():
    return "user_id" in session  # send back to login


@app.route("/login", methods=["POST"])
def login_method():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    db = get_db()

    user = db.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()

    if user and check_password_hash(user["password"], password):
        session["user_id"] = user["id"]
        return {"status": "ok"}

    return {"status": "invalid"}


@app.route("/dashboard")
def home():
    if not require_login():
        return redirect("/login-page")

    return render_template("index.html")


@app.route("/example")
def example():
    return "yes bro"


@app.route("/add-leads", methods=["POST"])
def add_jeans():
    if not require_login():
        return redirect("/login-page")

    dataa = request.json
    db = get_db()

    for lead in dataa:
        db.execute("INSERT INTO leads (data) VALUES (?)", (json.dumps(lead),))

    db.commit()

    print("saved")
    return jsonify(["ok"]), 200


@app.route("/clear-leads")
def rem_jeans():
    if not require_login():
        return jsonify({"error": "not logged in"}), 401

    db = get_db()
    db.execute("DELETE FROM leads WHERE user_id=?", (session["user_id"],))
    db.commit()

    return jsonify(["ok"])


@app.route("/login-page")
def login():
    return render_template("login.html")


@app.route("/leads")
def jeads():
    if not require_login():
        return redirect("/login-page")

    db = get_db()
    rows = db.execute("SELECT * FROM leads").fetchall()

    leads = [json.loads(row["data"]) for row in rows]

    return render_template("leads.html", myleads=leads)


@app.route("/progress/<task_id>")
def progress(task_id):
    return str(progress_store.get(task_id, 0))


@app.route("/extract", methods=["POST"])
def extract():

    data = request.json
    business_type = data["type"]
    region = data["region"]
    limit = data["limit"]
    taskid = data["task_id"]
    leads = data_extractor(business_type, region, limit, taskid)

    return jsonify(leads)


@app.route("/logout")
def logout():
    session.clear()  # removes user_id and all session data
    return redirect("/login-page")


@app.route("/ai-insight", methods=["POST"])
def ai_insight():
    lead = request.json

    insight = ai_insights(lead)  # your function

    return {"insight": insight}


if __name__ == "__main__":
    app.run(debug=True)
