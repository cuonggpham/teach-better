// Bookmark API dùng localStorage

export const getBookmarks = (userId) => {
  const key = `bookmarks_${userId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const toggleBookmark = (userId, item) => {
  const key = `bookmarks_${userId}`;
  const list = getBookmarks(userId);

  const exists = list.find((b) => b.id === item.id);

  let newList;

  if (exists) {
    // Remove
    newList = list.filter((x) => x.id !== item.id);
  } else {
    // Add
    newList = [...list, { ...item, bookmarkedAt: new Date().toISOString() }];
  }

  localStorage.setItem(key, JSON.stringify(newList));
  return newList;
};
