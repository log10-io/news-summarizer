"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Switch, Text, Button, Select, SelectItem } from "@tremor/react";
import { RiRestartLine } from "@remixicon/react";
import { useInterval } from "usehooks-ts";
import Link from "next/link";

const modalEndpoint = process.env.NEXT_PUBLIC_MODAL_ENDPOINT;
const modalSecret = process.env.NEXT_PUBLIC_MODAL_SECRET;

function Comment({ feedback, completion_id }: any) {
  return (
    <form action="#" className="relative">
      <div className="mt-4 w-full overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
        <div className="flex">
          <div>
            <p className="pt-2 pl-3 text-xs text-gray-400 font-bold">
              AutoFeedback
            </p>
          </div>
          <div className="flex-1" />
          <div className="mr-2">
            <Link
              target="_blank"
              href={`https://log10.io/app/news-summarizer-demo/feedback/feedback?completion_id=${completion_id}&task_id=610c8e40-e2a8-4b9e-9653-a50af719a6d7&wide=false`}
              className="text-xs text-gray-400 font-bold"
            >
              See autofeedback
            </Link>
          </div>
        </div>
        <label htmlFor="description" className="sr-only">
          Description
        </label>
        <textarea
          rows={2}
          name="description"
          id="description"
          className="block w-full resize-none border-0 py-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
          placeholder="Write a description..."
          defaultValue={feedback?.comment}
        />

        {/* Spacer element to match the height of the toolbar */}
        <div aria-hidden="true">
          <div className="py-2">
            <div className="h-9" />
          </div>
          <div className="h-px" />
          <div className="py-2">
            <div className="py-px">
              <div className="h-9" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-px bottom-0">
        {/* Actions: These are just examples to demonstrate the concept, replace/wire these up however makes sense for your project. */}
        <div className="flex flex-nowrap justify-end space-x-2 px-2 py-2 sm:px-3">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3">
                <span className={"hidden truncate sm:ml-2 sm:block"}>
                  {Math.floor(
                    ((feedback?.jsonValues?.Accuracy || 0) / 7) * 100
                  )}{" "}
                  % accuracy
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3">
                <span className={"hidden truncate sm:ml-2 sm:block"}>
                  {Math.floor(
                    ((feedback?.jsonValues?.Coherence || 0) / 7) * 100
                  )}{" "}
                  % coherence
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3">
                <span className={"hidden truncate sm:ml-2 sm:block"}>
                  {Math.floor(
                    ((feedback?.jsonValues?.Coverage || 0) / 7) * 100
                  )}{" "}
                  % coverage
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3">
                <span className={"hidden truncate sm:ml-2 sm:block"}>
                  {Math.floor(((feedback?.jsonValues?.Overall || 0) / 7) * 100)}{" "}
                  % overall
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

const Post = ({ post, autofeedback }: any) => {
  // Poll for autofeedback at 1s interval
  const [feedback, setFeedback] = useState<any>();

  useInterval(
    () => {
      fetch(
        `${modalEndpoint}/autofeedback?completion_id=${post.completion_id}`,
        {
          headers: {
            "x-modal-secret": modalSecret || "",
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data) {
            const f = data.data.organization?.completion?.autoFeedback;
            if (f) {
              setFeedback(f);
              console.log("Feedback found, clearing interval");
            } else {
              console.log(`Feedback not found for ${post.completion_id}`);
            }
          }
        });
    },
    !feedback && autofeedback && post.completion_id ? 1000 : null
  );

  return (
    <article
      key={post.url}
      className="relative isolate flex flex-col gap-8 lg:flex-row"
      id={`post-${post.completion_id}`}
    >
      <div className="relative aspect-[16/9] sm:aspect-[2/1] lg:aspect-square lg:w-64 lg:shrink-0">
        <img
          src={post.image}
          alt=""
          className="absolute inset-0 h-full w-full rounded-2xl bg-gray-50 object-cover"
        />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
      </div>
      <div>
        <div className="group relative">
          <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
            <Link href={post.url}>{post.title}</Link>
          </h3>
          {post?.completion_id && (
            <Link
              target="_blank"
              href={`https://log10.io/app/news-summarizer-demo/completions?id=${post?.completion_id}&wide=false`}
              className="mt-4 text-xs text-gray-400 font-bold"
            >
              See log
            </Link>
          )}
          <p className="mt-5 text-sm leading-6 text-gray-600">{post.summary}</p>
          {autofeedback && feedback && (
            <Comment feedback={feedback} completion_id={post?.completion_id} />
          )}
          {autofeedback && !feedback && (
            <div
              role="status"
              className="flex flex-col justify-center items-center mt-4"
            >
              <svg
                aria-hidden="true"
                className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <Text>Autofeedback generating</Text>
              <span className="sr-only">Loading...</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default function Example() {
  const [sources, setSources] = useState("cnn");
  const [posts, setPosts] = useState<any>([]);
  const [autofeedback, setAutofeedback] = useState(false);
  const abort = useRef(new AbortController());

  const fetchNews = useCallback(
    async (useAutofeedback: boolean, sources: string) => {
      setPosts([]);

      if (abort.current) {
        abort.current.abort("Previous fetch aborted");
      }

      abort.current = new AbortController();

      for (let i = 0; i < 10; i++) {
        fetch(
          `${modalEndpoint}/news?sources=${sources}&autofeedback=${
            useAutofeedback || false
          }&reset_cache=true&start=${i}&end=${i + 1}`,
          {
            signal: abort.current.signal,
            headers: {
              "x-modal-secret": modalSecret || "",
            },
          }
        )
          .then((response) => response.json())
          .then((data) => data)
          .then((data) => {
            setPosts((posts: any) => [
              ...posts,
              ...data.filter(
                (item: any) =>
                  posts.findIndex((post: any) => post.url === item.url) === -1
              ),
            ]);
          });
      }
    },
    []
  );

  useEffect(() => {
    fetchNews(autofeedback, sources);
  }, [fetchNews, autofeedback, sources]);

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Log10 News Summarizer
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Feedback based news summarizer.
          </p>
          {/* Turn on autofeedback */}
          <div className="mt-8">
            <div className="flex gap-4">
              <Button
                icon={RiRestartLine}
                onClick={() => {
                  fetchNews(autofeedback, sources);
                }}
              >
                Refresh
              </Button>
              <div>
                <Text>Autofeedback {autofeedback ? "on" : "off"}</Text>
                <Switch
                  checked={autofeedback}
                  onChange={(e) => {
                    setAutofeedback(e);
                  }}
                />
              </div>
              <div>
                <Select
                  value={sources}
                  onValueChange={(e) => {
                    setSources(e);
                    setPosts([]);
                    abort.current.abort("Previous fetch aborted");
                    fetchNews(autofeedback, sources);
                  }}
                >
                  <SelectItem value="cnn">CNN</SelectItem>
                  <SelectItem value="business-insider">
                    Business insider
                  </SelectItem>
                </Select>
              </div>
            </div>
          </div>

          {posts.length == 0 && (
            // Center on screen
            <div className="flex items-center justify-center h-96">
              <div
                role="status"
                className="flex flex-col justify-center items-center"
              >
                <svg
                  aria-hidden="true"
                  className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <Text>Loading news... hang tight</Text>
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}

          {
            <div className="mt-16 space-y-20 lg:mt-20 lg:space-y-20">
              {posts.map((post: any) => (
                <Post key={post.url} post={post} autofeedback={autofeedback} />
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}
