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
  applyTheme(user.preferences && user.preferences.theme);
  void loadHomeFriends();
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

const friendsNavButton = document.querySelector("#friends-nav-button");
const friendsBadge = document.querySelector("#friends-badge");
const friendsPage = document.querySelector("#friends-page");
const friendsStatus = document.querySelector("#friends-status");
const homeFriendsCount = document.querySelector("#home-friends-count");
const homeFriendsRow = document.querySelector("#home-friends-row");
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
  friendsPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadFriendsPage();
}

friendsNavButton.addEventListener("click", showFriendsPage);

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
  includeUnavailable: false,
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
  if (item.isNew) {
    const badges = document.createElement("div");
    badges.className = "catalog-badges";
    const badge = document.createElement("span");
    badge.className = "catalog-badge";
    badge.textContent = "New";
    badges.appendChild(badge);
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

void initializeSession();
