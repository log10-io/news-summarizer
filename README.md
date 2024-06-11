# Log10 News Summarizer App

This is a [Log10](https://log10.io) demo application which summarizes news articles and use AutoFeedback to grade the quality of the LLM output.

![News summarizer screenshot](./docs/images/news-summarizer.png)

## Setup

The application is built to be run on [vercel](https://vercel.com) and [modal](https://modal.com) and use OpenAI for summarization:

```mermaid
graph TD
    A[User] -->|Accesses| B[Web Application]
    B -->|Fetches articles| C[News Summarizer Service]
    B -->|Fetches autofeedback| C[News Summarizer Service]
    C -->|Fetches articles from| D[NewsAPI]
    C -->|Summarizes articles using| E[OpenAI API]
    C -->|Logs traces with| F[Log10]
    C -->|Fetches autofeedback from| F[Log10]

    subgraph Vercel
        B
    end

    subgraph Modal
        C
    end

    subgraph External APIs
        D
        E
        F
    end
```

Start by forking this repository so it is available in your profile at https://github.com/\<your handle\>/news-summarizer by clicking the fork button in github.

![Github fork](./docs/images/fork.png)

### Log10

Go to https://log10.io/signup and create an organization, if you don't already have one.

Once you get to the on-boarding screen, click the "Summary grading" example feedback task.

![Summary grading task in on-boarding](./docs/images/create-summary-grading.png)

This should redirect you to the feedback screen in Log10. To get your credentials, the fastest way is to click "add feedback".

![Click add feedback to get credentials](./docs/images/add-feedback.png)

**Save the credentials in the instructions when setting up the modal backend.**

![Keys](./docs/images/keys.png)

### OpenAI

Sign up with OpenAI, if you don't already have an account [here](https://platform.openai.com/signup) or [login](https://platform.openai.com/).

Go to the [API keys page](https://platform.openai.com/api-keys) and create a key and save it for later.



### NewsAPI

Create a NewAPI key [here](https://newsapi.org/register) ans save it for later.

### Modal

Start by creating an account in modal [here](https://modal.com/signup).

#### Secrets

When you have logged in, click the secrets tab and click "Create new secret"

![Create new secret](./docs/images/create-new-secret.png)

Then click "Custom":

![Custom environment](./docs/images/custom-environment.png)

And create secrets for log10, openai and the newsapi:

![Secrets](./docs/images/secrets.png)

Then, name the secret "news-secret":

![news-secret](./docs/images/news-secret.png)

And finalize the secret creation.

#### Installing modal and deploying service


```bash
$ cd service
$ virtualenv venv
$ . ./venv
$ pip install -r requirements.txt
$ python3 -m modal setup
# Follow instructions to log into your modal account
$ modal deploy main.py
```

This should print out something like:

```
✓ Created objects.
├── 🔨 Created mount /Users/niklasqnielsen/workspace/log10/news-summarizer/service/main.py
└── 🔨 Created fastapi_app => https://<your handle>--news-summarizer-fastapi-app.modal.run
✓ App deployed! 🎉
```

Note down the `https://<your handle>--news-summarizer-fastapi-app.modal.run` for setting up vercel.

### Vercel / Web app

Log in with your github credentials [here](https://vercel.com/login), and click "Add new..." and select "Project".

![Git repo selection](./docs/images/git-select.png)

Now set the modal endpoint that you noted above in the environment variable list, and click deploy.

![Configure environment](./docs/images/modal-endpoint.png)

After the site has been deployed, you should now be able to go to the vercel url and see the new summarizer.

![Summarizer running](./docs/images/summarizer.png)

