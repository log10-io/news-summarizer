from modal import App, web_endpoint, Image
import modal

image = (
    Image.debian_slim()
    .apt_install(["git"])
    .pip_install_from_requirements("requirements.txt")
)
app = App("news-summarizer", image=image)


from log10.load import OpenAI
import requests
from bs4 import BeautifulSoup
from newsapi import NewsApiClient

article_cache = {}

# Initialize the News API client
newsapi = NewsApiClient(api_key="cc2f2407c4184ff8a9ac99ffc90f435b")


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
    client = OpenAI(tags=tags)

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

    return response.choices[0].message.content


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


@app.function(secrets=[modal.Secret.from_name("news-secrets")])
@web_endpoint()
def news(reset_cache: bool = False, autofeedback: bool = False, start=0, end=10):
    if reset_cache:
        article_cache.clear()

    articles = fetch_news()
    news_with_summaries = []

    articles = articles[int(start):int(end)]

    for article in articles:
        if article["url"] in article_cache:
            summary = article_cache[article["url"]].get("summary")
            content = article_cache[article["url"]].get("content")
        else:
            content = scrape_article(article["url"])
            if content:
                summary = summarize_article(content, autofeedback)
                article_cache[article["url"]] = {
                    "summary": summary,
                    "content": content,
                }

        news_with_summaries.append(
            {
                "original": content,
                "summary": summary,
                "title": article["title"],
                "url": article["url"],
                "image": article["urlToImage"],
            }
        )

    return news_with_summaries
