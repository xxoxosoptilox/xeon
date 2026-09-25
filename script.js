const form = document.querySelector("#signup-form");
const message = document.querySelector("#form-message");
const requiredFields = ["month", "day", "year", "username", "password"];
const loginCard = document.querySelector(".login-card");
const signupCard = document.querySelector(".signup-card");
const loginButton = document.querySelector('[data-action="login"]');
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const blackScreen = document.querySelector("#black-screen");
const homeScreen = document.querySelector("#home-screen");
const userNameTargets = document.querySelectorAll("[data-user-name]");
const robuxBalanceTargets = document.querySelectorAll("[data-robux-balance]");
const apiBase = "";
const sidebarToggle = document.querySelector("#sidebar-toggle");
const settingsButton = document.querySelector("#settings-button");
const accountMenu = document.querySelector("#account-menu");
const logoutButton = document.querySelector("#logout-button");
const openSettingsButton = document.querySelector("#open-settings-button");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const THEMES = { xeon: "Xeon Theme", dark2016: "Dark (2016)", modern: "Modern Light", midnight: "Midnight" };
const PRIVACY_OPTIONS = [["everyone", "Everyone"], ["friends", "Friends"], ["nobody", "No one"]];

let currentUser = null;
let selectedGender = null;

const settingsOverlay = document.querySelector("#settings-overlay");
const settingsCloseButton = document.querySelector("#settings-close");
const settingsUsername = document.querySelector("#settings-username");
const editUsernameButton = document.querySelector("#edit-username-button");
const usernameEditor = document.querySelector("#username-editor");
const newUsernameInput = document.querySelector("#new-username");
const usernamePasswordInput = document.querySelector("#username-password");
const saveUsernameButton = document.querySelector("#save-username");
const editPasswordButton = document.querySelector("#edit-password-button");
const passwordEditor = document.querySelector("#password-editor");
const currentPasswordInput = document.querySelector("#current-password");
const newPasswordInput = document.querySelector("#new-password");
const confirmPasswordInput = document.querySelector("#confirm-password");
const savePasswordButton = document.querySelector("#save-password");
const discordAccountLabel = document.querySelector("#discord-account-label");
const discordConnectButton = document.querySelector("#discord-connect-button");
const discordUnlinkButton = document.querySelector("#discord-unlink-button");
const accountStatus = document.querySelector("#account-status");
const blurbInput = document.querySelector("#settings-blurb");
const settingsMonth = document.querySelector("#settings-month");
const settingsDay = document.querySelector("#settings-day");
const settingsYear = document.querySelector("#settings-year");
const settingsGenderButtons = document.querySelectorAll(".settings-gender button");
const savePersonalButton = document.querySelector("#save-personal");
const personalStatus = document.querySelector("#personal-status");
const privacySelects = document.querySelectorAll(".privacy-select");
const privacyStatus = document.querySelector("#privacy-status");
const themeSelect = document.querySelector("#theme-select");
const themeStatus = document.querySelector("#theme-status");

function showMessage(text) {
  message.textContent = text;
}

function showLoginMessage(text) {
  loginMessage.textContent = text;
}

function applyTheme(name) {
  homeScreen.dataset.theme = THEMES[name] ? name : "xeon";
}

function displayUser(user) {
  const safeUsername = (user.username || "User").trim() || "User";
  userNameTargets.forEach((target) => { target.textContent = safeUsername; });
  const robuxText = safeUsername.toLowerCase() === "roblox" ? "∞" : String(user.robux ?? 0);
  robuxBalanceTargets.forEach((target) => { target.textContent = robuxText; });
  adminNavButton.hidden = !user.isAdmin;
  adminNavButton.style.display = user.isAdmin ? "" : "none";
  if (!user.isAdmin) {
    adminPage.hidden = true;
  }
  applyTheme(user.preferences && user.preferences.theme);
  void loadHomeFriends();
  void loadRecommended();
}

function openHomeScreen() {
  blackScreen.hidden = false;
  blackScreen.setAttribute("aria-hidden", "false");
  setTimeout(() => {
    blackScreen.hidden = true;
    blackScreen.setAttribute("aria-hidden", "true");
    signupCard.hidden = true;
    loginCard.hidden = true;
    homeScreen.hidden = false;
  }, 900);
}

function enterHomeInstant() {
  signupCard.hidden = true;
  loginCard.hidden = true;
  blackScreen.hidden = true;
  homeScreen.hidden = false;
}

function showHomeFor(username) {
  if (!currentUser) {
    currentUser = { username, preferences: {} };
  }
  displayUser(currentUser);
  localStorage.setItem("xedraUsername", username.trim() || "User");
  openHomeScreen();
  void refreshCurrentUser();
}

function restoreHomeScreen() {
  const savedUsername = localStorage.getItem("xedraUsername");
  if (!savedUsername) {
    return;
  }
  currentUser = { username: savedUsername, preferences: {} };
  displayUser(currentUser);
  signupCard.hidden = true;
  loginCard.hidden = true;
  blackScreen.hidden = true;
  homeScreen.hidden = false;
}

async function fetchMe() {
  try {
    const response = await fetch(`${apiBase}/api/me`, { credentials: "same-origin" });
    if (response.status === 401 || !response.ok) {
      return null;
    }
    const result = await response.json();
    return result.user || null;
  } catch {
    return undefined;
  }
}

async function refreshCurrentUser() {
  const user = await fetchMe();
  if (user) {
    currentUser = user;
    displayUser(user);
  }
  return user;
}

async function initializeSession() {
  const user = await fetchMe();
  if (user) {
    currentUser = user;
    displayUser(user);
    enterHomeInstant();
    return;
  }
  if (user === null) {
    localStorage.removeItem("xedraUsername");
    applyTheme("xeon");
    return;
  }
  restoreHomeScreen();
}

form.addEventListener("submit", (event) => {
  void submitSignup(event);
});

async function submitSignup(event) {
  event.preventDefault();
  const username = document.querySelector("#username").value.trim();
  const password = document.querySelector("#password").value;
  const month = document.querySelector("#month").selectedIndex;
  const day = document.querySelector("#day").value;
  const year = document.querySelector("#year").value;
  const missingField = requiredFields.some((id) => !document.querySelector(`#${id}`).value.trim());
  if (missingField) {
    showMessage("Complete all required fields before signing up.");
    return;
  }
  if (username.length < 3) {
    showMessage("Username must be at least 3 characters.");
    return;
  }
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    showMessage("Username can only use letters, numbers, and underscores.");
    return;
  }

  const genderButton = document.querySelector(".gender-button.selected");
  const birthday = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  showMessage("Creating your account...");

  try {
    const response = await fetch(`${apiBase}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username, password, birthday, gender: genderButton?.dataset.gender })
    });
    const result = await response.json();
    if (!response.ok) {
      showMessage(result.error || "Could not create the account.");
      return;
    }
    currentUser = result.user;
    showHomeFor(result.user.username);
  } catch (error) {
    showMessage("The server is not running. Start it with: node server.js");
  }
}

document.querySelectorAll(".gender-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".gender-button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
  });
});

function setView(view) {
  const showLogin = view === "login";
  signupCard.hidden = showLogin;
  loginCard.hidden = !showLogin;
  loginButton.textContent = showLogin ? "Sign Up" : "Log In";
  loginButton.dataset.action = showLogin ? "signup" : "login";
}

loginButton.addEventListener("click", () => {
  const openingLogin = loginCard.hidden;
  setView(openingLogin ? "login" : "signup");
});

loginForm.addEventListener("submit", (event) => {
  void submitLogin(event);
});

async function submitLogin(event) {
  event.preventDefault();
  const username = document.querySelector("#login-username").value.trim();
  const password = document.querySelector("#login-password").value;
  if (!username || !password) {
    showLoginMessage("Enter both fields to log in.");
    return;
  }

  showLoginMessage("Checking your account...");
  try {
    const response = await fetch(`${apiBase}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (!response.ok) {
      showLoginMessage(result.error || "Invalid username or password.");
      return;
    }
    currentUser = result.user;
    showHomeFor(result.user.username);
  } catch (error) {
    showLoginMessage("The server is not running. Start it with: node server.js");
  }
}

document.querySelectorAll('[data-action="forgot"], [data-action="code"], [data-action="device"]').forEach((button) => {
  button.addEventListener("click", () => showLoginMessage("This demo action will be connected when your account system is ready."));
});

document.querySelector('[data-action="signup"]').addEventListener("click", () => {
  setView("signup");
});

document.querySelectorAll('[data-action="terms"], [data-action="privacy"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showMessage(`${link.textContent} will be added in the next step.`);
  });
});

sidebarToggle.addEventListener("click", () => {
  const collapsed = homeScreen.classList.toggle("sidebar-collapsed");
  sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  sidebarToggle.setAttribute("aria-label", collapsed ? "Show sidebar" : "Hide sidebar");
});

settingsButton.addEventListener("click", () => {
  const isOpen = !accountMenu.hidden;
  accountMenu.hidden = isOpen;
  settingsButton.setAttribute("aria-expanded", String(!isOpen));
});

logoutButton.addEventListener("click", async () => {
  try {
    await fetch(`${apiBase}/api/logout`, { method: "POST", credentials: "same-origin" });
  } catch {
  }
  currentUser = null;
  localStorage.removeItem("xedraUsername");
  sessionStorage.clear();
  accountMenu.hidden = true;
  homeScreen.hidden = true;
  blackScreen.hidden = true;
  applyTheme("xeon");
  loginCard.hidden = false;
  signupCard.hidden = true;
  setView("login");
  document.querySelector("#login-username").value = "";
  document.querySelector("#login-password").value = "";
});

const playerSearchInput = document.querySelector("#player-search");
const homeDefaultContent = document.querySelector("#home-default-content");
const searchResultsSection = document.querySelector("#search-results-section");
const searchResultsQuery = document.querySelector("#search-results-query");
const searchResultsCount = document.querySelector("#search-results-count");
const searchResultsGrid = document.querySelector("#search-results-grid");

function showDefaultHomeContent() {
  searchResultsSection.hidden = true;
  friendsPage.hidden = true;
  catalogPage.hidden = true;
  adminPage.hidden = true;
  itemPage.hidden = true;
  createPage.hidden = true;
  configurePage.hidden = true;
  homeDefaultContent.hidden = false;
}

function createPlayerResultCard(user) {
  const card = document.createElement("div");
  card.className = "player-result-card";

  const head = document.createElement("div");
  head.className = "player-result-head";
  const avatar = document.createElement("img");
  avatar.src = "noFilter.png";
  avatar.alt = "";
  const text = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = user.username;
  const status = document.createElement("span");
  status.textContent = "Offline";
  text.append(name, status);
  head.append(avatar, text);

  const actions = document.createElement("div");
  actions.className = "player-result-actions";

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "add-friend-button";
  if (user.is_friend) {
    addButton.textContent = "Friends";
    addButton.disabled = true;
  } else if (user.request_sent) {
    addButton.textContent = "Request Sent";
    addButton.disabled = true;
  } else {
    addButton.textContent = "Add Friend";
    addButton.addEventListener("click", async () => {
      addButton.disabled = true;
      const { ok, result } = await apiCall("POST", "/api/friends/requests", { userId: user.id });
      if (ok) {
        addButton.textContent = "Request Sent";
        return;
      }
      addButton.disabled = false;
      const message = result.error || "Could not send the request.";
      if (/already friends/i.test(message)) {
        addButton.textContent = "Friends";
        addButton.disabled = true;
      } else if (/already sent you/i.test(message)) {
        addButton.textContent = "Check Requests";
        searchResultsCount.textContent = message;
      } else {
        searchResultsCount.textContent = message;
      }
    });
  }

  const followButton = document.createElement("button");
  followButton.type = "button";
  followButton.className = "add-friend-button";
  followButton.textContent = user.is_following ? "Unfollow" : "Follow";
  followButton.addEventListener("click", async () => {
    followButton.disabled = true;
    const path = user.is_following ? `/api/follows/${user.id}` : "/api/follows";
    const { ok } = await apiCall(user.is_following ? "DELETE" : "POST", path, user.is_following ? undefined : { userId: user.id });
    if (ok) {
      user.is_following = !user.is_following;
      followButton.textContent = user.is_following ? "Unfollow" : "Follow";
    }
    followButton.disabled = false;
  });

  actions.append(addButton, followButton);
  card.append(head, actions);
  return card;
}

async function runPlayerSearch(rawQuery) {
  const query = rawQuery.trim();
  if (!query) {
    showDefaultHomeContent();
    return;
  }
  searchResultsQuery.textContent = query;
  searchResultsCount.textContent = "Searching...";
  searchResultsGrid.textContent = "";
  homeDefaultContent.hidden = true;
  friendsPage.hidden = true;
  catalogPage.hidden = true;
  adminPage.hidden = true;
  itemPage.hidden = true;
  searchResultsSection.hidden = false;

  try {
    const response = await fetch(`${apiBase}/api/users/search?q=${encodeURIComponent(query)}`, { credentials: "same-origin" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      searchResultsCount.textContent = result.error || "Could not search players.";
      return;
    }
    const users = result.users || [];
    searchResultsCount.textContent = `${users.length} result${users.length === 1 ? "" : "s"}`;
    if (!users.length) {
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = "No players found.";
      searchResultsGrid.appendChild(empty);
      return;
    }
    users.forEach((user) => searchResultsGrid.appendChild(createPlayerResultCard(user)));
  } catch {
    searchResultsCount.textContent = "The server is not running. Start it with: node server.js";
  }
}

playerSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void runPlayerSearch(playerSearchInput.value);
  }
});
playerSearchInput.addEventListener("search", () => {
  if (!playerSearchInput.value.trim()) {
    showDefaultHomeContent();
  }
});

const homeNavButton = document.querySelector("#home-nav-button");
homeNavButton.addEventListener("click", () => {
  playerSearchInput.value = "";
  showDefaultHomeContent();
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
});

async function apiCall(method, path, body) {
  try {
    const response = await fetch(`${apiBase}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined
    });
    const result = await response.json().catch(() => ({}));
    return { ok: response.ok, result };
  } catch {
    return { ok: false, result: { error: "The server is not running. Start it with: node server.js" } };
  }
}

async function apiCallRaw(method, path, buffer, contentType) {
  try {
    const response = await fetch(`${apiBase}${path}`, {
      method,
      headers: { "Content-Type": contentType },
      credentials: "same-origin",
      body: buffer
    });
    const result = await response.json().catch(() => ({}));
    return { ok: response.ok, result };
  } catch {
    return { ok: false, result: { error: "The server is not running. Start it with: node server.js" } };
  }
}

const friendsNavButton = document.querySelector("#friends-nav-button");
const supportNavButton = document.querySelector("#support-nav-button");
const friendsBadge = document.querySelector("#friends-badge");
const friendsPage = document.querySelector("#friends-page");
const friendsStatus = document.querySelector("#friends-status");
const homeFriendsCount = document.querySelector("#home-friends-count");
const homeFriendsRow = document.querySelector("#home-friends-row");
const recommendRow = document.querySelector("#recommend-row");
const friendsTabs = Array.from(document.querySelectorAll(".friends-tab"));
const friendsPanels = {
  requests: document.querySelector("#friends-panel-requests"),
  friends: document.querySelector("#friends-panel-friends"),
  followers: document.querySelector("#friends-panel-followers"),
  following: document.querySelector("#friends-panel-following")
};

function showFriendsPage() {
  homeDefaultContent.hidden = true;
  searchResultsSection.hidden = true;
  catalogPage.hidden = true;
  adminPage.hidden = true;
  itemPage.hidden = true;
  createPage.hidden = true;
  configurePage.hidden = true;
  friendsPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadFriendsPage();
}

friendsNavButton.addEventListener("click", showFriendsPage);

supportNavButton.addEventListener("click", () => {
  window.open("https://discord.gg/VDHnCDtX2", "_blank", "noopener");
});

friendsTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    friendsTabs.forEach((item) => item.classList.toggle("active", item === tab));
    Object.entries(friendsPanels).forEach(([key, panel]) => {
      panel.hidden = key !== tab.dataset.tab;
    });
  });
});

function setFriendsStatus(message, isError) {
  friendsStatus.hidden = !message;
  friendsStatus.textContent = message || "";
  friendsStatus.classList.toggle("error", Boolean(isError));
}

function setTabCount(tab, count) {
  tab.textContent = `${tab.dataset.label} (${count})`;
}

function friendPageCard(user, buttons) {
  const card = document.createElement("div");
  card.className = "friend-page-card";
  const avatar = document.createElement("img");
  avatar.src = "noFilter.png";
  avatar.alt = "";
  const name = document.createElement("span");
  name.className = "friend-name";
  name.textContent = user.username;
  const actions = document.createElement("div");
  actions.className = "friend-card-actions";
  buttons.forEach((button) => actions.appendChild(button));
  card.append(avatar, name, actions);
  return card;
}

function friendActionButton(label, primary, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = primary ? "friend-action-button primary" : "friend-action-button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function emptyFriendsNote(text) {
  const note = document.createElement("p");
  note.className = "friends-empty";
  note.textContent = text;
  return note;
}

function updateFriendsChrome(data) {
  const requests = data.requests || [];
  const friends = data.friends || [];

  const requestsTab = friendsTabs.find((tab) => tab.dataset.tab === "requests");
  setTabCount(requestsTab, requests.length);
  friendsBadge.hidden = requests.length === 0;
  friendsBadge.textContent = String(requests.length);
  friendsTabs.forEach((tab) => {
    if (tab !== requestsTab) {
      setTabCount(tab, (data[tab.dataset.tab] || []).length);
    }
  });

  homeFriendsCount.textContent = `(${friends.length})`;
  homeFriendsRow.textContent = "";
  if (!friends.length) {
    homeFriendsRow.appendChild(emptyFriendsNote("You have no friends yet."));
    return;
  }
  friends.forEach((user) => {
    const card = document.createElement("div");
    card.className = "friend-home-card";
    const avatar = document.createElement("img");
    avatar.src = "noFilter.png";
    avatar.alt = "";
    const name = document.createElement("span");
    name.textContent = user.username;
    card.append(avatar, name);
    homeFriendsRow.appendChild(card);
  });
}

async function loadHomeFriends() {
  const { ok, result } = await apiCall("GET", "/api/friends");
  if (ok) {
    updateFriendsChrome(result);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function loadRecommended() {
  if (!recommendRow) return;
  recommendRow.innerHTML = "";
  const { ok, result } = await apiCall("GET", "/api/create/recommended");
  if (!ok || !result.creations) return;
  const games = result.creations.filter((game) => game.icon_type);
  if (!games.length) {
    recommendRow.innerHTML = '<p class="search-empty">No games yet.</p>';
    return;
  }
  games.forEach((game) => {
    const card = document.createElement("div");
    card.className = "recommend-card";
    const iconUrl = `/api/create/${game.id}/icon`;
    card.innerHTML =
      `<div class="recommend-thumb"><img src="${iconUrl}" alt="" /></div>` +
      `<div class="recommend-title">${escapeHtml(game.name)}</div>`;
    recommendRow.appendChild(card);
  });
}

async function respondToRequest(requestId, action) {
  setFriendsStatus("");
  const { ok, result } = await apiCall("POST", `/api/friends/requests/${requestId}/${action}`);
  if (!ok) {
    setFriendsStatus(result.error || "Could not update the request.", true);
    return;
  }
  await loadFriendsPage();
}

async function toggleFollow(user, button) {
  button.disabled = true;
  const path = user.is_following ? `/api/follows/${user.id}` : "/api/follows";
  const { ok } = await apiCall(user.is_following ? "DELETE" : "POST", path, user.is_following ? undefined : { userId: user.id });
  if (ok) {
    user.is_following = !user.is_following;
    button.textContent = user.is_following ? "Unfollow" : "Follow";
  }
  button.disabled = false;
}

async function loadFriendsPage() {
  setFriendsStatus("Loading...");
  const { ok, result } = await apiCall("GET", "/api/friends");
  if (!ok) {
    Object.values(friendsPanels).forEach((panel) => { panel.textContent = ""; });
    setFriendsStatus(result.error || "Could not load your friends.", true);
    return;
  }
  setFriendsStatus("");

  const data = result;
  const requests = data.requests || [];
  const friends = data.friends || [];
  const followers = data.followers || [];
  const following = data.following || [];
  updateFriendsChrome(data);

  friendsPanels.requests.textContent = "";
  if (!requests.length) {
    friendsPanels.requests.appendChild(emptyFriendsNote("You have no friend requests."));
  } else {
    requests.forEach((user) => {
      friendsPanels.requests.appendChild(friendPageCard(user, [
        friendActionButton("Accept", true, () => void respondToRequest(user.request_id, "accept")),
        friendActionButton("Decline", false, () => void respondToRequest(user.request_id, "decline"))
      ]));
    });
  }

  friendsPanels.friends.textContent = "";
  if (!friends.length) {
    friendsPanels.friends.appendChild(emptyFriendsNote("You have no friends yet."));
  } else {
    friends.forEach((user) => {
      friendsPanels.friends.appendChild(friendPageCard(user, [
        friendActionButton("Unfriend", false, async () => {
          const unfriendResult = await apiCall("DELETE", `/api/friends/${user.id}`);
          if (!unfriendResult.ok) {
            setFriendsStatus(unfriendResult.result.error || "Could not unfriend.", true);
            return;
          }
          await loadFriendsPage();
        })
      ]));
    });
  }

  friendsPanels.followers.textContent = "";
  if (!followers.length) {
    friendsPanels.followers.appendChild(emptyFriendsNote("You have no followers."));
  } else {
    followers.forEach((user) => {
      const buttons = [];
      if (!user.is_friend) {
        buttons.push(friendActionButton("Add Friend", false, async (event) => {
          const button = event.currentTarget;
          button.disabled = true;
          const addResult = await apiCall("POST", "/api/friends/requests", { userId: user.id });
          if (addResult.ok) {
            button.textContent = "Request Sent";
            return;
          }
          button.disabled = false;
          setFriendsStatus(addResult.result.error || "Could not send the request.", true);
        }));
      }
      if (user.following_back) {
        const button = friendActionButton("Following", false, () => {});
        button.disabled = true;
        buttons.push(button);
      } else {
        const button = friendActionButton("Follow Back", true, () => void toggleFollow(user, button));
        buttons.push(button);
      }
      friendsPanels.followers.appendChild(friendPageCard(user, buttons));
    });
  }

  friendsPanels.following.textContent = "";
  if (!following.length) {
    friendsPanels.following.appendChild(emptyFriendsNote("You are not following anyone."));
  } else {
    following.forEach((user) => {
      const button = friendActionButton("Unfollow", false, () => void toggleFollow(user, button));
      friendsPanels.following.appendChild(friendPageCard(user, [button]));
    });
  }
}

const CATALOG_GENRES = [
  ["building", "Building"], ["horror", "Horror"], ["town_and_city", "Town and City"],
  ["military", "Military"], ["comedy", "Comedy"], ["medieval", "Medieval"],
  ["adventure", "Adventure"], ["sci-fi", "Sci-Fi"], ["naval", "Naval"], ["fps", "FPS"],
  ["rpg", "RPG"], ["sports", "Sports"], ["fighting", "Fighting"], ["western", "Western"]
];
const CATALOG_CATEGORY_LABELS = {
  all: "All Categories",
  featured: "All Featured Items",
  featured_accessories: "Featured Accessories",
  featured_faces: "Featured Faces",
  featured_gear: "Featured Gear",
  community: "Community Creations",
  collectibles: "Collectibles",
  clothing: "Clothing",
  body_parts: "Body Parts",
  gear: "Gear",
  accessories: "Accessories"
};
const ROBUX_ICON = "Firefly_Gemini_Flash_remove_the_backround_284772-removebg-preview.png";

const catalogNavButton = document.querySelector("#catalog-nav-button");
const topMarketplaceButton = document.querySelector("#top-marketplace-button");
const catalogPage = document.querySelector("#catalog-page");
const catalogCategories = Array.from(document.querySelectorAll(".catalog-category"));
const catalogGenreList = document.querySelector("#catalog-genre-list");
const catalogCrumb = document.querySelector("#catalog-crumb");
const catalogCount = document.querySelector("#catalog-count");
const catalogGrid = document.querySelector("#catalog-grid");
const catalogSearch = document.querySelector("#catalog-search");
const catalogSort = document.querySelector("#catalog-sort");
const catalogCreatorName = document.querySelector("#catalog-creator-name");
const catalogMinPrice = document.querySelector("#catalog-min-price");
const catalogMaxPrice = document.querySelector("#catalog-max-price");

const catalogState = {
  category: "all",
  genre: "",
  creator: "",
  creatorType: "",
  currency: "",
  priceMode: "any",
  minPrice: "",
  maxPrice: "",
  includeUnavailable: true,
  q: "",
  sort: "relevance"
};

function buildGenreRadios() {
  const allItem = document.createElement("label");
  allItem.className = "catalog-radio";
  const allRadio = document.createElement("input");
  allRadio.type = "radio";
  allRadio.name = "catalog-genre";
  allRadio.value = "";
  allRadio.checked = true;
  allItem.append(allRadio, " All Genres");
  catalogGenreList.appendChild(allItem);
  CATALOG_GENRES.forEach(([value, label]) => {
    const item = document.createElement("label");
    item.className = "catalog-radio";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "catalog-genre";
    radio.value = value;
    item.append(radio, ` ${label}`);
    catalogGenreList.appendChild(item);
  });
}
buildGenreRadios();

function showCatalogPage() {
  homeDefaultContent.hidden = true;
  searchResultsSection.hidden = true;
  friendsPage.hidden = true;
  adminPage.hidden = true;
  itemPage.hidden = true;
  createPage.hidden = true;
  configurePage.hidden = true;
  catalogPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadCatalog();
}

catalogNavButton.addEventListener("click", showCatalogPage);
topMarketplaceButton.addEventListener("click", showCatalogPage);

catalogCategories.forEach((button) => {
  button.addEventListener("click", () => {
    catalogCategories.forEach((item) => item.classList.toggle("active", item === button));
    catalogState.category = button.dataset.category;
    void loadCatalog();
  });
});

catalogGenreList.addEventListener("change", (event) => {
  if (event.target.name === "catalog-genre") {
    catalogState.genre = event.target.value;
    void loadCatalog();
  }
});

document.querySelectorAll('input[name="catalog-creator"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    catalogState.creator = radio.value;
    catalogCreatorName.value = "";
    void loadCatalog();
  });
});

document.querySelector("#catalog-creator-go").addEventListener("click", () => {
  catalogState.creator = catalogCreatorName.value.trim();
  document.querySelectorAll('input[name="catalog-creator"]').forEach((radio) => {
    radio.checked = radio.value === "" && !catalogState.creator;
  });
  void loadCatalog();
});

document.querySelectorAll('input[name="catalog-creator-type"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    catalogState.creatorType = radio.value;
    void loadCatalog();
  });
});

document.querySelectorAll('input[name="catalog-currency"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    catalogState.currency = radio.value;
    void loadCatalog();
  });
});

document.querySelectorAll('input[name="catalog-price"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    catalogState.priceMode = radio.value === "free" ? "free" : "any";
    void loadCatalog();
  });
});

document.querySelector("#catalog-price-go").addEventListener("click", () => {
  catalogState.minPrice = catalogMinPrice.value.trim();
  catalogState.maxPrice = catalogMaxPrice.value.trim();
  catalogState.priceMode = "range";
  document.querySelectorAll('input[name="catalog-price"]').forEach((radio) => {
    radio.checked = false;
  });
  void loadCatalog();
});

document.querySelectorAll('input[name="catalog-unavailable"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    catalogState.includeUnavailable = radio.value === "show";
    void loadCatalog();
  });
});

catalogSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    catalogState.q = catalogSearch.value.trim();
    void loadCatalog();
  }
});
catalogSearch.addEventListener("search", () => {
  if (!catalogSearch.value.trim()) {
    catalogState.q = "";
    void loadCatalog();
  }
});

catalogSort.addEventListener("change", () => {
  catalogState.sort = catalogSort.value;
  void loadCatalog();
});

const catalogCodeButton = document.querySelector("#catalog-code-button");
const catalogCodeRow = document.querySelector("#catalog-code-row");
const catalogCodeInput = document.querySelector("#catalog-code-input");
const catalogCodeGo = document.querySelector("#catalog-code-go");
const catalogCodeStatus = document.querySelector("#catalog-code-status");

catalogCodeButton.addEventListener("click", () => {
  const open = catalogCodeRow.hidden;
  catalogCodeRow.hidden = !open;
  catalogCodeButton.setAttribute("aria-expanded", String(open));
  if (open) {
    catalogCodeInput.focus();
  }
});

async function followCatalogCode() {
  const code = catalogCodeInput.value.trim();
  if (!/^\d+$/.test(code)) {
    setStatus(catalogCodeStatus, "Item codes are numbers only.", true);
    catalogCodeStatus.hidden = false;
    return;
  }
  const { ok, result } = await apiCall("GET", `/api/catalog/by-code/${encodeURIComponent(code)}`);
  if (!ok || !result.itemId) {
    setStatus(catalogCodeStatus, result.error || "No item matches that code.", true);
    catalogCodeStatus.hidden = false;
    return;
  }
  catalogCodeStatus.hidden = true;
  await openItemPage(result.itemId);
}

catalogCodeGo.addEventListener("click", () => void followCatalogCode());
catalogCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void followCatalogCode();
  }
});

function hasActiveCatalogFilters() {
  return catalogState.category !== "all"
    || Boolean(catalogState.genre)
    || Boolean(catalogState.creator)
    || Boolean(catalogState.creatorType)
    || Boolean(catalogState.currency)
    || catalogState.priceMode !== "any"
    || catalogState.includeUnavailable
    || Boolean(catalogState.q);
}

function buildCatalogQuery() {
  const params = new URLSearchParams();
  if (catalogState.category !== "all") {
    params.set("category", catalogState.category);
  }
  if (catalogState.genre) {
    params.set("genre", catalogState.genre);
  }
  if (catalogState.creator) {
    params.set("creator", catalogState.creator);
  }
  if (catalogState.creatorType) {
    params.set("creatorType", catalogState.creatorType);
  }
  if (catalogState.currency) {
    params.set("currency", catalogState.currency);
  }
  if (catalogState.priceMode === "free") {
    params.set("free", "1");
  }
  if (catalogState.priceMode === "range") {
    if (catalogState.minPrice !== "") {
      params.set("minPrice", catalogState.minPrice);
    }
    if (catalogState.maxPrice !== "") {
      params.set("maxPrice", catalogState.maxPrice);
    }
  }
  if (catalogState.includeUnavailable) {
    params.set("includeUnavailable", "1");
  }
  if (catalogState.q) {
    params.set("q", catalogState.q);
  }
  if (catalogState.sort !== "relevance") {
    params.set("sort", catalogState.sort);
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

function createCatalogItemCard(item) {
  const card = document.createElement("div");
  card.className = "catalog-item";

  const thumb = document.createElement("div");
  thumb.className = "catalog-thumb";
  if (item.thumbnailUrl) {
    const image = document.createElement("img");
    image.src = item.thumbnailUrl;
    image.alt = item.name;
    thumb.appendChild(image);
  } else {
    const initial = document.createElement("span");
    initial.className = "catalog-thumb-initial";
    initial.textContent = (item.name || "?").trim().charAt(0) || "?";
    thumb.appendChild(initial);
  }
  if (item.isNew || !item.isAvailable) {
    const badges = document.createElement("div");
    badges.className = "catalog-badges";
    if (item.isNew) {
      const badge = document.createElement("span");
      badge.className = "catalog-badge";
      badge.textContent = "New";
      badges.appendChild(badge);
    }
    if (!item.isAvailable) {
      const offSale = document.createElement("span");
      offSale.className = "catalog-badge offsale";
      offSale.textContent = "Off Sale";
      badges.appendChild(offSale);
    }
    thumb.appendChild(badges);
  }

  const body = document.createElement("div");
  body.className = "catalog-item-body";
  const name = document.createElement("p");
  name.className = "catalog-item-name";
  name.textContent = item.name;
  name.title = item.name;
  body.appendChild(name);

  if (item.isLimited || item.isLimitedUnique) {
    const tags = document.createElement("div");
    tags.className = "catalog-item-tags";
    if (item.isLimited) {
      const limited = document.createElement("span");
      limited.className = "catalog-tag limited";
      limited.textContent = "LIMITED";
      tags.appendChild(limited);
    }
    if (item.isLimitedUnique) {
      const unique = document.createElement("span");
      unique.className = "catalog-tag unique";
      unique.textContent = "U";
      tags.appendChild(unique);
    }
    body.appendChild(tags);
  }

  const price = document.createElement("p");
  price.className = "catalog-item-price";
  if (item.price === 0) {
    price.classList.add("free");
    price.textContent = "Free";
  } else if (item.currency === "tickets") {
    price.textContent = `${item.price} Tickets`;
  } else {
    const icon = document.createElement("img");
    icon.src = ROBUX_ICON;
    icon.alt = "Robux";
    const amount = document.createElement("span");
    amount.textContent = String(item.price);
    price.append(icon, amount);
  }
  body.appendChild(price);

  if (item.salesCount > 0) {
    const sales = document.createElement("p");
    sales.className = "catalog-item-sales";
    sales.textContent = `Sales ${item.salesCount}`;
    body.appendChild(sales);
  }

  card.append(thumb, body);
  card.addEventListener("click", () => openItemPage(item.id));
  return card;
}

async function loadCatalog() {
  catalogCount.textContent = "Loading...";
  const { ok, result } = await apiCall("GET", `/api/catalog${buildCatalogQuery()}`);
  if (!ok) {
    catalogGrid.textContent = "";
    catalogCount.textContent = result.error || "Could not load the catalog.";
    return;
  }
  const items = result.items || [];
  const total = result.total || 0;
  catalogCrumb.textContent = CATALOG_CATEGORY_LABELS[catalogState.category] || "All Categories";
  catalogCount.textContent = total === 0
    ? "0 Results"
    : `1 - ${items.length} of ${total} Result${total === 1 ? "" : "s"}`;
  catalogGrid.textContent = "";
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "catalog-empty";
    empty.textContent = hasActiveCatalogFilters()
      ? "No items match your filters. Try a different category or search."
      : "There are no items in the catalog yet. Check back soon for new gear, faces, and more.";
    catalogGrid.appendChild(empty);
    return;
  }
  items.forEach((item) => catalogGrid.appendChild(createCatalogItemCard(item)));
}

function fillSelect(select, placeholder, items, selectedValue) {
  select.textContent = "";
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });
  if (selectedValue) {
    select.value = selectedValue;
  }
}

fillSelect(settingsMonth, "Month", MONTHS.map((label, index) => ({ value: String(index + 1), label })));
fillSelect(settingsDay, "Day", Array.from({ length: 31 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) })));
const currentYear = new Date().getFullYear();
const yearItems = [];
for (let year = currentYear; year >= 1950; year -= 1) {
  yearItems.push({ value: String(year), label: String(year) });
}
fillSelect(settingsYear, "Year", yearItems);
privacySelects.forEach((select) => {
  fillSelect(select, "Select", PRIVACY_OPTIONS.map(([value, label]) => ({ value, label })));
});
Object.entries(THEMES).forEach(([value, label]) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  themeSelect.appendChild(option);
});

function setStatus(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle("error", isError);
}

function populateSettings(user) {
  settingsUsername.textContent = user.username;
  blurbInput.value = user.blurb || "";

  const [birthYear, birthMonth, birthDay] = String(user.birthday || "").split("-");
  settingsMonth.value = birthMonth ? String(Number(birthMonth)) : "";
  settingsDay.value = birthDay ? String(Number(birthDay)) : "";
  settingsYear.value = birthYear || "";

  selectedGender = user.gender === "male" || user.gender === "female" ? user.gender : null;
  settingsGenderButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.genderValue === selectedGender);
  });

  const preferences = user.preferences || {};
  privacySelects.forEach((select) => {
    select.value = preferences[select.dataset.pref] || "everyone";
  });
  themeSelect.value = THEMES[preferences.theme] ? preferences.theme : "xeon";

  usernameEditor.hidden = true;
  passwordEditor.hidden = true;
  const discordName = user.discordId || user.discordUsername || "";
  discordAccountLabel.textContent = discordName || "Not connected";
  discordConnectButton.textContent = discordName ? "Change" : "Connect";
  discordUnlinkButton.hidden = !discordName;
  setStatus(accountStatus, "");
  setStatus(personalStatus, "");
  setStatus(privacyStatus, "");
  setStatus(themeStatus, "");
}

async function openSettings() {
  const user = await fetchMe();
  if (!user) {
    return;
  }
  currentUser = user;
  displayUser(user);
  populateSettings(user);
  accountMenu.hidden = true;
  settingsOverlay.hidden = false;
}

function closeSettings() {
  settingsOverlay.hidden = true;
}

openSettingsButton.addEventListener("click", () => {
  void openSettings();
});
settingsCloseButton.addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", (event) => {
  if (event.target === settingsOverlay) {
    closeSettings();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !settingsOverlay.hidden) {
    closeSettings();
  }
});

editUsernameButton.addEventListener("click", () => {
  usernameEditor.hidden = !usernameEditor.hidden;
  if (!usernameEditor.hidden) {
    newUsernameInput.focus();
  }
});
editPasswordButton.addEventListener("click", () => {
  passwordEditor.hidden = !passwordEditor.hidden;
  if (!passwordEditor.hidden) {
    currentPasswordInput.focus();
  }
});
document.querySelectorAll("[data-close-editor]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`#${button.dataset.closeEditor}`).hidden = true;
  });
});

async function apiPut(path, body) {
  try {
    const response = await fetch(`${apiBase}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    return { ok: response.ok, result };
  } catch {
    return { ok: false, result: { error: "The server is not running. Start it with: node server.js" } };
  }
}

saveUsernameButton.addEventListener("click", async () => {
  const newUsername = newUsernameInput.value.trim();
  if (newUsername.length < 3 || !/^[A-Za-z0-9_]+$/.test(newUsername)) {
    setStatus(accountStatus, "Username must be 3+ characters using only letters, numbers, or underscores.", true);
    return;
  }
  setStatus(accountStatus, "Saving username...");
  const { ok, result } = await apiPut("/api/me/username", { newUsername, password: usernamePasswordInput.value });
  if (!ok) {
    setStatus(accountStatus, result.error || "Could not change your username.", true);
    return;
  }
  currentUser.username = result.user.username;
  displayUser(currentUser);
  settingsUsername.textContent = result.user.username;
  localStorage.setItem("xedraUsername", result.user.username);
  newUsernameInput.value = "";
  usernamePasswordInput.value = "";
  usernameEditor.hidden = true;
  setStatus(accountStatus, "Username changed.");
});

savePasswordButton.addEventListener("click", async () => {
  const newPassword = newPasswordInput.value;
  if (newPassword.length < 8) {
    setStatus(accountStatus, "New password must be at least 8 characters.", true);
    return;
  }
  if (newPassword !== confirmPasswordInput.value) {
    setStatus(accountStatus, "New passwords do not match.", true);
    return;
  }
  setStatus(accountStatus, "Saving password...");
  const { ok, result } = await apiPut("/api/me/password", {
    currentPassword: currentPasswordInput.value,
    newPassword
  });
  if (!ok) {
    setStatus(accountStatus, result.error || "Could not change your password.", true);
    return;
  }
  currentPasswordInput.value = "";
  newPasswordInput.value = "";
  confirmPasswordInput.value = "";
  passwordEditor.hidden = true;
  setStatus(accountStatus, "Password changed. Other sessions were signed out.");
});

settingsGenderButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.genderValue;
    selectedGender = selectedGender === value ? null : value;
    settingsGenderButtons.forEach((item) => {
      item.classList.toggle("selected", item.dataset.genderValue === selectedGender);
    });
  });
});

function buildSettingsBirthday() {
  const { value: month } = settingsMonth;
  const { value: day } = settingsDay;
  const { value: year } = settingsYear;
  if (!month || !day || !year) {
    return null;
  }
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

savePersonalButton.addEventListener("click", async () => {
  const birthday = buildSettingsBirthday();
  if (!birthday) {
    setStatus(personalStatus, "Pick a full birthday.", true);
    return;
  }
  setStatus(personalStatus, "Saving...");
  const { ok, result } = await apiPut("/api/me", {
    blurb: blurbInput.value,
    birthday,
    gender: selectedGender
  });
  if (!ok) {
    setStatus(personalStatus, result.error || "Could not save.", true);
    return;
  }
  currentUser = result.user;
  displayUser(currentUser);
  setStatus(personalStatus, "Saved.");
});

privacySelects.forEach((select) => {
  select.addEventListener("change", async () => {
    setStatus(privacyStatus, "Saving...");
    const { ok, result } = await apiPut("/api/me", { preferences: { [select.dataset.pref]: select.value } });
    if (!ok) {
      setStatus(privacyStatus, result.error || "Could not save.", true);
      return;
    }
    currentUser = result.user;
    setStatus(privacyStatus, "Privacy updated.");
  });
});

themeSelect.addEventListener("change", async () => {
  applyTheme(themeSelect.value);
  setStatus(themeStatus, "Saving theme...");
  const { ok, result } = await apiPut("/api/me", { preferences: { theme: themeSelect.value } });
  if (!ok) {
    setStatus(themeStatus, result.error || "Could not save theme.", true);
    return;
  }
  currentUser = result.user;
  setStatus(themeStatus, "Theme saved.");
});

const adminNavButton = document.querySelector("#admin-nav-button");
const adminPage = document.querySelector("#admin-page");
const adminImportInput = document.querySelector("#admin-import-input");
const adminImportButton = document.querySelector("#admin-import-button");
const adminImportStatus = document.querySelector("#admin-import-status");
const adminImportResult = document.querySelector("#admin-import-result");
const adminImportCode = document.querySelector("#admin-import-code");
const adminImportPreview = document.querySelector("#admin-import-preview");
const adminUpdateCode = document.querySelector("#admin-update-code");
const adminUpdatePrice = document.querySelector("#admin-update-price");
const adminUpdateRap = document.querySelector("#admin-update-rap");
const adminUpdateStock = document.querySelector("#admin-update-stock");
const adminUpdateCategory = document.querySelector("#admin-update-category");
const adminUpdateButton = document.querySelector("#admin-update-button");
const adminUpdateStatus = document.querySelector("#admin-update-status");
const adminDeleteCode = document.querySelector("#admin-delete-code");
const adminDeleteButton = document.querySelector("#admin-delete-button");
const adminRefundButton = document.querySelector("#admin-refund-button");
const adminDeleteStatus = document.querySelector("#admin-delete-status");
const adminCodesList = document.querySelector("#admin-codes-list");

const itemPage = document.querySelector("#item-page");
const itemDetail = document.querySelector("#item-detail");
const itemBackButton = document.querySelector("#item-back-button");

function showAdminPage() {
  homeDefaultContent.hidden = true;
  searchResultsSection.hidden = true;
  friendsPage.hidden = true;
  catalogPage.hidden = true;
  itemPage.hidden = true;
  createPage.hidden = true;
  configurePage.hidden = true;
  adminPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadAdminCodes();
}

adminNavButton.addEventListener("click", showAdminPage);

async function loadAdminCodes() {
  const { ok, result } = await apiCall("GET", "/api/admin/imports");
  adminCodesList.textContent = "";
  if (!ok) {
    const line = document.createElement("li");
    line.textContent = result.error || "Could not load the import codes.";
    adminCodesList.appendChild(line);
    return;
  }
  const imports = result.imports || [];
  if (!imports.length) {
    const line = document.createElement("li");
    line.className = "empty";
    line.textContent = "No codes generated yet. Import an asset above to get one.";
    adminCodesList.appendChild(line);
    return;
  }
  imports.forEach((entry) => {
    const line = document.createElement("li");
    const code = document.createElement("strong");
    code.textContent = `Code ${entry.code}`;
    const name = document.createElement("span");
    name.className = "code-name";
    name.textContent = `${entry.name || "Unknown"} (asset ${entry.asset_id})`;
    const state = document.createElement("span");
    state.className = entry.catalog_item_id ? "code-state used" : "code-state";
    state.textContent = entry.catalog_item_id ? `in catalog as item #${entry.catalog_item_id}` : "waiting for Update Asset";
    line.append(code, name, state);
    adminCodesList.appendChild(line);
  });
}

function adminPreviewList(data) {
  adminImportPreview.textContent = "";
  const rows = [
    ["Name", data.name],
    ["Asset ID", data.assetId],
    ["Creator", data.creatorName || "Unknown"],
    ["RAP", data.rap],
    ["Value", data.value],
    ["Price (Roblox)", data.price],
    ["Stock", data.stock === null || data.stock === undefined ? "Unknown" : data.stock],
    ["Limited", data.isLimitedUnique ? "Limited Unique" : data.isLimited ? "Limited" : "Not Limited"]
  ];
  rows.forEach(([label, value]) => {
    const line = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = `${label}: `;
    line.append(strong, document.createTextNode(String(value ?? "")));
    adminImportPreview.appendChild(line);
  });
}

adminImportButton.addEventListener("click", async () => {
  const asset = adminImportInput.value.trim();
  if (!asset) {
    setStatus(adminImportStatus, "Enter a Rolimons link or asset ID.", true);
    return;
  }
  adminImportButton.disabled = true;
  setStatus(adminImportStatus, "Fetching asset from Rolimons + Roblox...");
  const { ok, result } = await apiCall("POST", "/api/admin/import", { asset });
  adminImportButton.disabled = false;
  if (!ok) {
    adminImportResult.hidden = true;
    setStatus(adminImportStatus, result.error || "Could not import that asset.", true);
    return;
  }
  const sources = result.data.sources || {};
  const sourceNote = [sources.rolimons ? "Rolimons" : null, sources.roblox ? "Roblox" : null].filter(Boolean).join(" + ");
  setStatus(adminImportStatus, sourceNote ? `Imported from ${sourceNote}.` : "Imported with partial data. Fill in the fields below manually.");
  adminImportCode.textContent = String(result.code);
  adminPreviewList(result.data);
  adminImportResult.hidden = false;
  adminUpdateCode.value = String(result.code);
  adminUpdatePrice.value = String(result.data.price || "");
  adminUpdateRap.value = String(result.data.rap || "");
  adminUpdateStock.value = result.data.stock === null || result.data.stock === undefined ? "" : String(result.data.stock);
  adminUpdateCategory.value = result.data.isLimitedUnique ? "limited_unique" : result.data.isLimited ? "limited" : "not_limited";
  void loadAdminCodes();
});

adminUpdateButton.addEventListener("click", async () => {
  adminUpdateButton.disabled = true;
  setStatus(adminUpdateStatus, "Creating catalog item...");
  const payload = {
    code: adminUpdateCode.value.trim(),
    price: adminUpdatePrice.value.trim(),
    rap: adminUpdateRap.value.trim(),
    stock: adminUpdateStock.value.trim(),
    category: adminUpdateCategory.value
  };
  const { ok, result } = await apiCall("POST", "/api/admin/update-asset", payload);
  adminUpdateButton.disabled = false;
  if (!ok) {
    setStatus(adminUpdateStatus, result.error || "Could not update the asset.", true);
    return;
  }
  setStatus(adminUpdateStatus, `"${result.item.name}" is now live in the catalog.`);
  adminImportResult.hidden = true;
  adminUpdateCode.value = "";
  adminUpdatePrice.value = "";
  adminUpdateRap.value = "";
  adminUpdateStock.value = "";
  adminUpdateCategory.value = "";
  void loadAdminCodes();
  openItemPage(result.item.id);
});

async function removeItemByCode(refund) {
  const code = adminDeleteCode.value.trim();
  if (!code) {
    setStatus(adminDeleteStatus, "Enter the import code of the item you want to delete.", true);
    return;
  }
  const question = refund
    ? `Delete the item made from code ${code} and refund every buyer the Robux they spent?`
    : `Delete the item made from code ${code}? The code is removed too.`;
  if (!window.confirm(question)) {
    return;
  }
  adminDeleteButton.disabled = true;
  adminRefundButton.disabled = true;
  setStatus(adminDeleteStatus, refund ? "Refunding and deleting..." : "Deleting...");
  const { ok, result } = await apiCall("POST", refund ? "/api/admin/delete-and-refund" : "/api/admin/delete-item", { code });
  adminDeleteButton.disabled = false;
  adminRefundButton.disabled = false;
  if (!ok) {
    setStatus(adminDeleteStatus, result.error || "Could not delete the item.", true);
    return;
  }
  const removed = result.name ? `"${result.name}" and code ${code} were removed.` : `Code ${code} was removed.`;
  setStatus(adminDeleteStatus, refund ? `${removed} ${result.refunded} buyer(s) got ${result.totalRobux} Robux back.` : removed);
  adminDeleteCode.value = "";
  void loadAdminCodes();
}

adminDeleteButton.addEventListener("click", () => void removeItemByCode(false));
adminRefundButton.addEventListener("click", () => void removeItemByCode(true));

itemBackButton.addEventListener("click", showCatalogPage);

const topCreateButton = document.querySelector("#top-create-button");
const createPage = document.querySelector("#create-page");
const createTabs = Array.from(document.querySelectorAll("#create-tabs .create-tab"));
const createTypes = Array.from(document.querySelectorAll("#create-types .create-type"));
const createNewButton = document.querySelector("#create-new-button");
const createPaneTitle = document.querySelector("#create-pane-title");
const createPaneEmpty = document.querySelector("#create-pane-empty");
const createFileInput = document.querySelector("#create-file-input");
const createList = document.querySelector("#create-list");
const createStatus = document.querySelector("#create-status");

let createTab = "mine";
let createType = createTypes[0];
let myCreations = [];

const ROW_GLYPHS = { place: "▣", model: "▤", audio: "♫" };

function creationName(creation) {
  return creation.name || String(creation.filename || "creation").replace(/\.[A-Za-z0-9]{1,5}$/, "");
}

function closeCreateMenus() {
  createList.querySelectorAll(".create-row-menu").forEach((menu) => {
    menu.hidden = true;
  });
}

function renderCreatePane() {
  const plural = createType.dataset.plural;
  const kind = createType.dataset.kind || "";
  createNewButton.textContent = `Create New ${createType.dataset.singular}`;
  createNewButton.disabled = createTab === "group" || !kind;
  createPaneTitle.textContent = plural;
  createFileInput.accept = kind ? createType.dataset.exts : "";

  const mine = kind && createTab === "mine" ? myCreations.filter((item) => item.kind === kind) : [];
  createList.textContent = "";
  mine.forEach((creation) => {
    const name = creationName(creation);

    const line = document.createElement("li");

    const thumb = document.createElement("div");
    thumb.className = "create-thumb";
    thumb.textContent = ROW_GLYPHS[creation.kind] || "▣";

    const info = document.createElement("div");
    info.className = "create-row-info";
    const title = document.createElement("strong");
    title.className = "create-row-title";
    title.textContent = name;
    info.appendChild(title);
    if (creation.kind === "place") {
      const startPlace = document.createElement("span");
      startPlace.className = "create-row-meta";
      startPlace.textContent = `Start Place:  ${name}`;
      info.appendChild(startPlace);
    }
    const privacy = document.createElement("span");
    privacy.className = "create-row-meta";
    privacy.textContent = creation.allow_access === false ? "Private" : "Public";
    info.appendChild(privacy);

    const settingsWrap = document.createElement("div");
    settingsWrap.className = "create-row-settings-wrap";
    const gear = document.createElement("button");
    gear.type = "button";
    gear.className = "create-row-settings";
    gear.setAttribute("aria-label", `Settings for ${name}`);
    gear.setAttribute("aria-expanded", "false");
    gear.textContent = "⚙ ▾";
    const menu = document.createElement("div");
    menu.className = "create-row-menu";
    menu.hidden = true;
    if (creation.kind === "place") {
      const configure = document.createElement("button");
      configure.type = "button";
      configure.textContent = "Configure Game";
      configure.addEventListener("click", () => {
        menu.hidden = true;
        openConfigurePage(creation);
      });
      menu.appendChild(configure);
    }
    const download = document.createElement("a");
    download.href = `/api/create/download/${creation.id}`;
    download.textContent = "Download";
    menu.appendChild(download);
    gear.addEventListener("click", () => {
      const wasOpen = !menu.hidden;
      closeCreateMenus();
      menu.hidden = wasOpen;
      gear.setAttribute("aria-expanded", wasOpen ? "false" : "true");
    });
    settingsWrap.append(gear, menu);

    line.append(thumb, info, settingsWrap);
    createList.appendChild(line);
  });

  let emptyText = "";
  if (createTab === "group") {
    emptyText = "You aren't in any groups.";
  } else if (!kind) {
    emptyText = `Uploading ${plural.toLowerCase()} isn't supported yet.`;
  } else if (!mine.length) {
    emptyText = `You haven't created any ${plural.toLowerCase()}.`;
  }
  createPaneEmpty.textContent = emptyText;
  createPaneEmpty.hidden = !emptyText;
}

async function loadMyCreations() {
  const { ok, result } = await apiCall("GET", "/api/create/mine");
  myCreations = ok ? result.creations || [] : [];
  renderCreatePane();
}

createTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    createTabs.forEach((item) => item.classList.toggle("active", item === tab));
    createTab = tab.dataset.pane;
    renderCreatePane();
  });
});

createTypes.forEach((type) => {
  type.addEventListener("click", () => {
    createTypes.forEach((item) => item.classList.toggle("active", item === type));
    createType = type;
    renderCreatePane();
  });
});

createNewButton.addEventListener("click", () => {
  if (!createNewButton.disabled) {
    createFileInput.click();
  }
});

createFileInput.addEventListener("change", async () => {
  const file = createFileInput.files[0];
  createFileInput.value = "";
  if (!file) {
    return;
  }
  createNewButton.disabled = true;
  setStatus(createStatus, "");
  const query = new URLSearchParams({ kind: createType.dataset.kind, name: file.name });
  try {
    const response = await fetch(`/api/create/upload?${query}`, {
      method: "POST",
      credentials: "same-origin",
      body: file
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(createStatus, result.error || "Could not upload the file.", true);
      return;
    }
    await loadMyCreations();
  } catch {
    setStatus(createStatus, "The upload was rejected or the server went away.", true);
  } finally {
    renderCreatePane();
  }
});

function showCreatePage() {
  homeDefaultContent.hidden = true;
  searchResultsSection.hidden = true;
  friendsPage.hidden = true;
  catalogPage.hidden = true;
  adminPage.hidden = true;
  itemPage.hidden = true;
  configurePage.hidden = true;
  createPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadMyCreations();
}

topCreateButton.addEventListener("click", showCreatePage);

const configurePage = document.querySelector("#configure-page");
const configureTabs = Array.from(document.querySelectorAll("#configure-tabs .configure-tab"));
const configurePaneTitle = document.querySelector("#configure-pane-title");
const configureBasic = document.querySelector("#configure-basic");
const configureEmpty = document.querySelector("#configure-empty");
const configureName = document.querySelector("#configure-name");
const configureDescription = document.querySelector("#configure-description");
const configureComments = document.querySelector("#configure-comments");
const configureAccess = document.querySelector("#configure-access");
const configureVoice = document.querySelector("#configure-voice");
const configureGenre = document.querySelector("#configure-genre");
const configureSaveButton = document.querySelector("#configure-save");
const configureCancelButton = document.querySelector("#configure-cancel");
const configureStatus = document.querySelector("#configure-status");

const configureUpload = document.querySelector("#configure-upload");
const configureUploadFile = document.querySelector("#configure-upload-file");
const configureUploadButton = document.querySelector("#configure-upload-button");
const configureUploadStatus = document.querySelector("#configure-upload-status");

const configureIconPane = document.querySelector("#configure-icon");
const configureIconPreview = document.querySelector("#configure-icon-preview");
const configureIconImage = document.querySelector("#configure-icon-image");
const configureIconUpload = document.querySelector("#configure-icon-upload");
const configureIconFile = document.querySelector("#configure-icon-file");
const configureIconStatus = document.querySelector("#configure-icon-status");

const configureThumbnails = document.querySelector("#configure-thumbnails");
const configureThumbPreview = document.querySelector("#configure-thumb-preview");
const configureThumbImage = document.querySelector("#configure-thumb-image");
const configureThumbFile = document.querySelector("#configure-thumb-file");
const configureThumbGenerate = document.querySelector("#configure-thumb-generate");
const configureThumbStatus = document.querySelector("#configure-thumb-status");

const configureAccessTab = document.querySelector("#configure-access-tab");
const configureMaxVisitors = document.querySelector("#configure-max-visitors");
const configureYear = document.querySelector("#configure-year");
const configureRigType = document.querySelector("#configure-rig-type");
const configureAccessSave = document.querySelector("#configure-access-save");
const configureAccessCancel = document.querySelector("#configure-access-cancel");
const configureAccessStatus = document.querySelector("#configure-access-status");

const CONFIGURE_PANES = {
  basic: configureBasic,
  upload: configureUpload,
  icon: configureIconPane,
  thumbnails: configureThumbnails,
  access: configureAccessTab
};

let configuring = null;

configureGenre.append(
  ...["All", ...CATALOG_GENRES.map(([, label]) => label)].map((label) => {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    return option;
  })
);

for (let y = 2024; y >= 2006; y--) {
  const option = document.createElement("option");
  option.value = String(y);
  option.textContent = String(y);
  configureYear.appendChild(option);
}

function selectBoolean(select, value) {
  select.value = value ? "true" : "false";
}

function refreshConfigureImages() {
  if (!configuring) return;
  if (configuring.icon_type) {
    configureIconImage.src = `/api/create/${configuring.id}/icon?_=${Date.now()}`;
    configureIconImage.hidden = false;
    configureIconPreview.querySelector(".configure-icon-placeholder").hidden = true;
  } else {
    configureIconImage.hidden = true;
    configureIconPreview.querySelector(".configure-icon-placeholder").hidden = false;
  }
  if (configuring.thumbnail_type) {
    configureThumbImage.src = `/api/create/${configuring.id}/thumbnail?_=${Date.now()}`;
    configureThumbImage.hidden = false;
    configureThumbPreview.querySelector(".configure-icon-placeholder").hidden = true;
  } else {
    configureThumbImage.hidden = true;
    configureThumbPreview.querySelector(".configure-icon-placeholder").hidden = false;
  }
}

function openConfigurePage(creation) {
  configuring = creation;
  configureName.value = creation.name || creationName(creation);
  configureDescription.value = creation.description || "";
  selectBoolean(configureComments, creation.allow_comments);
  selectBoolean(configureAccess, creation.allow_access !== false);
  selectBoolean(configureVoice, creation.voice_chat);
  const genre = creation.genre || "All";
  if (!Array.from(configureGenre.options).some((option) => option.value === genre)) {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    configureGenre.appendChild(option);
  }
  configureGenre.value = genre;
  setStatus(configureStatus, "");

  configureMaxVisitors.value = String(creation.max_visitors || 10);
  configureYear.value = String(creation.year || 2021);
  configureRigType.value = creation.rig_type || "R6";
  setStatus(configureAccessStatus, "");

  configureUploadFile.value = "";
  setStatus(configureUploadStatus, "");
  setStatus(configureIconStatus, "");
  setStatus(configureThumbStatus, "");
  refreshConfigureImages();

  showConfigurePane("basic", "Basic Settings");

  homeDefaultContent.hidden = true;
  searchResultsSection.hidden = true;
  friendsPage.hidden = true;
  catalogPage.hidden = true;
  adminPage.hidden = true;
  itemPage.hidden = true;
  createPage.hidden = true;
  configurePage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
}

function showConfigurePane(pane, label) {
  configureTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.pane === pane));
  configurePaneTitle.textContent = label;
  for (const [key, el] of Object.entries(CONFIGURE_PANES)) {
    el.hidden = key !== pane;
  }
  configureEmpty.hidden = Boolean(CONFIGURE_PANES[pane]);
  configureEmpty.textContent = CONFIGURE_PANES[pane] ? "" : `${label} isn't available yet.`;
}

configureTabs.forEach((tab) => {
  tab.addEventListener("click", () => showConfigurePane(tab.dataset.pane, tab.dataset.label));
});

configureSaveButton.addEventListener("click", async () => {
  if (!configuring) {
    return;
  }
  configureSaveButton.disabled = true;
  setStatus(configureStatus, "");
  const { ok, result } = await apiCall("PUT", `/api/create/${configuring.id}`, {
    name: configureName.value,
    description: configureDescription.value,
    allowComments: configureComments.value === "true",
    allowAccess: configureAccess.value === "true",
    voiceChat: configureVoice.value === "true",
    genre: configureGenre.value
  });
  configureSaveButton.disabled = false;
  if (!ok) {
    setStatus(configureStatus, result.error || "Could not save the settings.", true);
    return;
  }
  Object.assign(configuring, result.creation);
  showCreatePage();
});

configureCancelButton.addEventListener("click", showCreatePage);

configureUploadButton.addEventListener("click", async () => {
  if (!configuring) return;
  const file = configureUploadFile.files && configureUploadFile.files[0];
  if (!file) {
    setStatus(configureUploadStatus, "Pick a .rbxl file first.", true);
    return;
  }
  configureUploadButton.disabled = true;
  setStatus(configureUploadStatus, "Uploading...");
  const buffer = await file.arrayBuffer();
  const { ok, result } = await apiCallRaw("PUT", `/api/create/${configuring.id}/upload?name=${encodeURIComponent(file.name)}`, buffer, "application/octet-stream");
  configureUploadButton.disabled = false;
  if (!ok) {
    setStatus(configureUploadStatus, result.error || "Could not upload the file.", true);
    return;
  }
  Object.assign(configuring, result.creation);
  configureUploadFile.value = "";
  setStatus(configureUploadStatus, "File replaced.");
});

configureIconUpload.addEventListener("click", () => configureIconFile.click());
configureIconFile.addEventListener("change", async () => {
  if (!configuring) return;
  const file = configureIconFile.files && configureIconFile.files[0];
  if (!file) return;
  const type = file.type || (file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : "image/png");
  configureIconUpload.disabled = true;
  setStatus(configureIconStatus, "Uploading icon...");
  const buffer = await file.arrayBuffer();
  const { ok, result } = await apiCallRaw("POST", `/api/create/${configuring.id}/icon`, buffer, type);
  configureIconUpload.disabled = false;
  if (!ok) {
    setStatus(configureIconStatus, result.error || "Could not upload the icon.", true);
    return;
  }
  Object.assign(configuring, result.creation);
  refreshConfigureImages();
  configureIconFile.value = "";
  setStatus(configureIconStatus, "Icon saved.");
});

configureThumbFile.addEventListener("change", async () => {
  if (!configuring) return;
  const file = configureThumbFile.files && configureThumbFile.files[0];
  if (!file) return;
  const type = file.type || (file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : "image/png");
  setStatus(configureThumbStatus, "Uploading thumbnail...");
  const buffer = await file.arrayBuffer();
  const { ok, result } = await apiCallRaw("POST", `/api/create/${configuring.id}/thumbnail`, buffer, type);
  if (!ok) {
    setStatus(configureThumbStatus, result.error || "Could not upload the thumbnail.", true);
    return;
  }
  Object.assign(configuring, result.creation);
  refreshConfigureImages();
  configureThumbFile.value = "";
  setStatus(configureThumbStatus, "Thumbnail saved.");
});

configureThumbGenerate.addEventListener("click", () => {
  setStatus(configureThumbStatus, "Auto-generate isn't available yet.", true);
});

configureAccessSave.addEventListener("click", async () => {
  if (!configuring) return;
  configureAccessSave.disabled = true;
  setStatus(configureAccessStatus, "");
  const { ok, result } = await apiCall("PUT", `/api/create/${configuring.id}/access`, {
    maxVisitors: Number(configureMaxVisitors.value),
    year: Number(configureYear.value),
    rigType: configureRigType.value
  });
  configureAccessSave.disabled = false;
  if (!ok) {
    setStatus(configureAccessStatus, result.error || "Could not save the access settings.", true);
    return;
  }
  Object.assign(configuring, result.creation);
  showCreatePage();
});

configureAccessCancel.addEventListener("click", showCreatePage);

function renderRobuxPrice(container, price) {
  const icon = document.createElement("img");
  icon.src = ROBUX_ICON;
  icon.alt = "Robux";
  icon.className = "robux-icon";
  const amount = document.createElement("span");
  amount.textContent = String(price);
  container.append(icon, amount);
}

async function openItemPage(itemId) {
  homeDefaultContent.hidden = true;
  searchResultsSection.hidden = true;
  friendsPage.hidden = true;
  catalogPage.hidden = true;
  adminPage.hidden = true;
  itemPage.hidden = false;
  createPage.hidden = true;
  configurePage.hidden = true;
  itemDetail.textContent = "Loading...";
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });

  const { ok, result } = await apiCall("GET", `/api/catalog/${itemId}`);
  if (!ok) {
    itemDetail.textContent = result.error || "Could not load the item.";
    return;
  }
  renderItemDetail(result.item);
}

const ITEM_TYPE_LABELS = {
  accessories: "Accessory",
  collectibles: "Collectible",
  clothing: "Clothing",
  body_parts: "Body Part",
  gear: "Gear",
  community: "Community Creation"
};
const CATALOG_GENRE_LABELS = Object.fromEntries(CATALOG_GENRES);

function renderItemDetail(item) {
  itemDetail.textContent = "";

  const page = document.createElement("div");
  page.className = "item-page";

  const thumb = document.createElement("div");
  thumb.className = "item-page-thumb";
  if (item.thumbnailUrl) {
    const image = document.createElement("img");
    image.src = item.thumbnailUrl;
    image.alt = item.name;
    thumb.appendChild(image);
  } else {
    const initial = document.createElement("span");
    initial.className = "catalog-thumb-initial";
    initial.textContent = (item.name || "?").trim().charAt(0) || "?";
    thumb.appendChild(initial);
  }
  if (item.isLimited || item.isLimitedUnique) {
    const ribbon = document.createElement("span");
    ribbon.className = "item-ribbon";
    ribbon.textContent = item.isLimitedUnique ? "LIMITED U" : "LIMITED";
    thumb.appendChild(ribbon);
  }
  if (item.isNew) {
    const ribbon = document.createElement("span");
    ribbon.className = "item-ribbon new";
    ribbon.textContent = "NEW";
    thumb.appendChild(ribbon);
  }

  const info = document.createElement("div");
  info.className = "item-page-info";

  const name = document.createElement("h2");
  name.className = "item-page-name";
  name.textContent = item.name;

  const creator = document.createElement("p");
  creator.className = "item-page-creator";
  creator.textContent = "By ";
  const creatorName = document.createElement("span");
  creatorName.className = "creator-name";
  creatorName.textContent = item.creatorName || "Unknown";
  creator.appendChild(creatorName);
  if ((item.creatorName || "").toLowerCase() === "roblox") {
    const verified = document.createElement("span");
    verified.className = "verified";
    verified.textContent = " ✔";
    verified.title = "Verified";
    creator.appendChild(verified);
  }

  const rows = document.createElement("dl");
  rows.className = "item-page-rows";

  const addRow = (label, text) => {
    const row = document.createElement("div");
    row.className = "item-row";
    const term = document.createElement("dt");
    term.textContent = label;
    const value = document.createElement("dd");
    value.textContent = text;
    row.append(term, value);
    rows.appendChild(row);
    return value;
  };

  const priceRow = document.createElement("div");
  priceRow.className = "item-row";
  const priceTerm = document.createElement("dt");
  priceTerm.textContent = "Price";
  const priceValue = document.createElement("dd");
  priceValue.className = "item-price-value";
  if (item.price === 0) {
    priceValue.textContent = "Free";
  } else {
    renderRobuxPrice(priceValue, item.price);
  }
  const buyButton = document.createElement("button");
  buyButton.type = "button";
  buyButton.className = "item-buy-button";
  priceRow.append(priceTerm, priceValue, buyButton);
  rows.appendChild(priceRow);

  addRow("Type", ITEM_TYPE_LABELS[item.category] || "Item");
  addRow("Sales", String(item.salesCount ?? 0));
  const stockValue = addRow("Stock", item.stock === null || item.stock === undefined ? "Unlimited" : String(item.stock));
  if (item.rap > 0) {
    addRow("RAP", String(item.rap));
  }
  addRow("Created", new Date(item.createdAt).toLocaleDateString("en-US"));
  addRow("Genres", item.genre ? CATALOG_GENRE_LABELS[item.genre] || item.genre : "All");
  addRow("Description", item.description || "No description.");

  const status = document.createElement("p");
  status.className = "settings-status item-buy-status";
  status.setAttribute("role", "status");

  const offSale = !item.isAvailable || (item.stock !== null && item.stock !== undefined && item.stock <= 0);
  if (item.isOwned) {
    buyButton.textContent = "Owned";
    buyButton.disabled = true;
  } else if (offSale) {
    buyButton.textContent = "Off Sale";
    buyButton.disabled = true;
  } else {
    buyButton.textContent = item.price === 0 ? "Get" : "Buy";
    buyButton.addEventListener("click", async () => {
      buyButton.disabled = true;
      setStatus(status, "Processing purchase...");
      const { ok, result } = await apiCall("POST", `/api/catalog/${item.id}/purchase`);
      if (!ok) {
        if (/already own/i.test(result.error || "")) {
          buyButton.textContent = "Owned";
        } else {
          buyButton.disabled = false;
        }
        setStatus(status, result.error || "Could not complete the purchase.", true);
        return;
      }
      setStatus(status, `You bought "${result.itemName}" for ${result.pricePaid} Robux.`);
      if (currentUser) {
        currentUser.robux = result.robux;
        displayUser(currentUser);
      }
      stockValue.textContent = result.stock === null ? "Unlimited" : String(result.stock);
      buyButton.textContent = "Owned";
      buyButton.disabled = true;
    });
  }

  info.append(name, creator, rows, status);
  if (item.sourceAssetId) {
    const rolimonsLink = document.createElement("a");
    rolimonsLink.className = "item-rolimons-link";
    rolimonsLink.href = `https://www.rolimons.com/item/${item.sourceAssetId}`;
    rolimonsLink.target = "_blank";
    rolimonsLink.rel = "noopener";
    rolimonsLink.textContent = "View on Rolimons";
    info.insertBefore(rolimonsLink, rows);
  }
  page.append(thumb, info);
  itemDetail.appendChild(page);
}

void initializeSession();

discordConnectButton.addEventListener("click", () => {
  window.location.href = "/api/discord/connect";
});

discordUnlinkButton.addEventListener("click", async () => {
  if (!window.confirm("Remove the Discord link from your account?")) {
    return;
  }
  discordUnlinkButton.disabled = true;
  const { ok, result } = await apiCall("POST", "/api/discord/unlink");
  discordUnlinkButton.disabled = false;
  if (!ok) {
    setStatus(accountStatus, result.error || "Could not unlink your Discord account.", true);
    return;
  }
  const user = await fetchMe();
  if (user) {
    currentUser = user;
    populateSettings(user);
  }
  setStatus(accountStatus, "Discord account removed.");
});

function handleDiscordRedirectParam() {
  const params = new URLSearchParams(window.location.search);
  const discordParam = params.get("discord");
  if (!discordParam) {
    return;
  }
  params.delete("discord");
  const query = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  void openSettings().then(() => {
    if (discordParam === "linked") {
      setStatus(accountStatus, "Discord account connected.");
    } else if (discordParam === "error") {
      setStatus(accountStatus, "Could not connect your Discord account. Try again.", true);
    } else if (discordParam === "ratelimit") {
      setStatus(accountStatus, "Discord is rate limiting. Please wait a few minutes and try again.", true);
    }
  });
}
handleDiscordRedirectParam();
