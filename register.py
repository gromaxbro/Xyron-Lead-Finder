import sqlite3

from werkzeug.security import generate_password_hash

DB_NAME = "database.db"


def create_user(username, password):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    try:
        hashed_password = generate_password_hash(password)

        cur.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, hashed_password),
        )

        conn.commit()
        print(f"✅ User '{username}' created successfully")

    except sqlite3.IntegrityError:
        print("❌ Username already exists")

    finally:
        conn.close()


if __name__ == "__main__":
    username = input("Enter username: ")
    password = input("Enter password: ")

    create_user(username, password)
