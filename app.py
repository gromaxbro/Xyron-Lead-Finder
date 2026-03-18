from flask import Flask, jsonify, render_template, request

from main import data_extractor

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/extract", methods=["POST"])
def extract():

    business_type = request.json.get("type")
    region = request.json.get("region")
    limit = int(request.json.get("limit", 30))
    leads = data_extractor(business_type, region, limit)

    return jsonify(leads)


if __name__ == "__main__":
    app.run(debug=True)
