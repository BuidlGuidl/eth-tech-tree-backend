import { Request } from "express";
import axios from "axios";

const PLAUSIBLE_EVENT_ENDPOINT = "https://plausible.io/api/event";

export const trackPlausibleEvent = async (eventName: string, props: {}, request: Request ) => {
  const payload = {
    domain: "ethtechtree.com",
    name: eventName,
    url: "https://ethtechtree.com/api",
    props,
  };

  const headers = {
    "User-Agent": request.headers["user-agent"],
    "X-Forwarded-For": request.headers["x-forwarded-for"] || request.socket.remoteAddress,
    "Content-Type": "application/json",
  };

  // We don't care about the response.
  return axios.post(PLAUSIBLE_EVENT_ENDPOINT, payload, {
    headers,
  });
};