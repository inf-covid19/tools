import { AUTOCOVS_API as API_URL } from "../../../constants";

export const makeGet = async (url, searchParams = {}) => {
  const qs = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    qs.append(key, typeof value === "object" ? JSON.stringify(value) : value);
  });

  const effectiveUrl = `${API_URL}${url}?${qs.toString()}`;

  const response = await fetch(effectiveUrl);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};
