from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from modal import App, Image, asgi_app
import modal

image = (
    Image.debian_slim()
    .apt_install(["git"])
    .pip_install_from_requirements("requirements.txt")
)
app = App("news-summarizer", image=image)


from log10.load import OpenAI, log10_session
import requests
from bs4 import BeautifulSoup
from newsapi import NewsApiClient

import os

article_cache = {}

# Initialize the News API client
newsapi = NewsApiClient(api_key="cc2f2407c4184ff8a9ac99ffc90f435b")

import requests


def fetch_autofeedback(id):
    api_token = os.getenv("LOG10_TOKEN")
    org_id = os.getenv("LOG10_ORG_ID")

    url = "https://graphql.log10.io/graphql"
    headers = {"content-type": "application/json", "x-api-token": api_token}
    query = """
    query OrganizationCompletion($orgId: String!, $id: String!) {
        organization(id: $orgId) {
            completion(id: $id) {
                id
                autoFeedback {
                    id
                    status
                    jsonValues
                    comment
                }
            }
        }
    }
    """
    variables = {"orgId": org_id, "id": id}
    payload = {"query": query, "variables": variables}

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        return response.json()
    else:
        response.raise_for_status()


def scrape_article(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    # Extract the main content from the article
    paragraphs = soup.find_all("p")
    article_content = " ".join([p.get_text() for p in paragraphs])

    return article_content


def fetch_news():
    # Fetch top headlines from CNN
    top_headlines = newsapi.get_top_headlines(sources="cnn")
    articles = top_headlines["articles"]
    return articles


def summarize_article(content, autofeedback):
    # Initialize the OpenAI client
    tags = ["news"]
    if autofeedback:
        tags.append("log10/summary-grading")
    client = OpenAI()

    print("Using tags: ", tags)

    with log10_session(tags=tags) as session:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert summarizer."},
                {
                    "role": "user",
                    "content": "Summarize the following article into a tweet sized summary:",
                },
                {"role": "user", "content": content},
            ],
        )

        url = session.last_completion_url()
        completion_id = None
        if url:
            completion_id = url.split("/")[-1]

    # Get the completion id.

    return completion_id, response.choices[0].message.content


# # @app.route('/news', methods=['GET'])
# # def get_news():
# #     articles = fetch_news()
# #     news_with_summaries = []
# #     for article in articles:
# #         content = scrape_article(article["url"])
# #         if content:
# #             summary = summarize_article(content)
# #             news_with_summaries.append({
# #                 "original": content,
# #                 "summary": summary,
# #                 "title": article["title"],
# #                 "url": article["url"]
# #             })
# #     return jsonify(news_with_summaries)


web_app = FastAPI()
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can specify specific origins instead of ["*"]
    allow_credentials=True,
    allow_methods=["*"],  # You can specify specific methods instead of ["*"]
    allow_headers=["*"],  # You can specify specific headers instead of ["*"]
)


@app.function(secrets=[modal.Secret.from_name("news-secrets")], image=image)
@asgi_app()
def fastapi_app():
    return web_app


@web_app.get("/autofeedback")
async def autofeedback(completion_id=None):
    if not completion_id:
        return {"error": "Please provide a completion ID."}

    return fetch_autofeedback(completion_id)


@web_app.get("/news")
async def news(autofeedback: bool = False, start=0, end=10):
    articles = fetch_news()
    news_with_summaries = []

    articles = articles[int(start) : int(end)]

    for article in articles:
        content = scrape_article(article["url"])
        if content:
            completion_id, summary = summarize_article(content, autofeedback)

        news_with_summaries.append(
            {
                "original": content,
                "summary": summary,
                "title": article["title"],
                "url": article["url"],
                "image": article["urlToImage"],
                "completion_id": completion_id,
            }
        )

    return news_with_summaries
