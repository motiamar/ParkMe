export function getOrCreateUserId() {
  let userId = localStorage.getItem("parkme_user_id");

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("parkme_user_id", userId);
  }

  return userId;
}
