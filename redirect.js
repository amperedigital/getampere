export default {
  fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname;

    // BLOCK main domain until launch
    if (host === "getampere.ai" || host === "www.getampere.ai") {
      return new Response("Coming soon.", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Allow dev domain
    return fetch(request);
  }
};
