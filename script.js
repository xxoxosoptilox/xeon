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
const premiumButton = document.querySelector(".premium-button");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const THEMES = { xeon: "Xeon Theme", dark2016: "Dark (2016)", modern: "Modern Light", midnight: "Midnight" };
const PRIVACY_OPTIONS = [["everyone", "Everyone"], ["friends", "Friends"], ["nobody", "No one"]];

let currentUser = null;
let selectedGender = null;

const ROUTES = {
  "/": async () => { hideAllPages(); homeDefaultContent.hidden = false; await initWelcomePortrait(); },
  "/login": showLoginPage,
  "/signup": showSignupPage,
  "/friends": showFriendsPage,
  "/catalog": showCatalogPage,
  "/inventory": showInventoryPage,
  "/profile": () => showProfilePage(),
  "/messages": () => { hideAllPages(); messagesPage.hidden = false; homeScreen.scrollTo({ top: 0, behavior: "smooth" }); },
  "/avatar": showAvatarPage,
  "/create": showCreatePage,
  "/settings": showSettingsPage,
  "/premium": showPremiumPage,
  "/download": showDownloadPage,
  "/transactions": showTransactionsPage,
  "/trades": showTradesPage,
  "/support": showSupportPage,
  "/search": () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    playerSearchInput.value = q;
    void runPlayerSearch(q);
  },
  "/admin": () => requireAdmin(showAdminPage),
  "/admin/bans": () => requireAdmin(showBanManagerPage),
  "/admin/users": () => requireAdmin(showUserSearchPage),
  "/admin/stats": () => requireAdmin(showServerStatsPage),
  "/admin/announcements": () => requireAdmin(showAnnouncementsPage),
  "/admin/give-items": () => requireAdmin(showGiveItemsPage),
  "/admin/reset-password": () => requireAdmin(showResetPasswordPage),
  "/admin/change-username": () => requireAdmin(showChangeUsernamePage),
  "/admin/audit-log": () => requireAdmin(showAuditLogPage),
  "/admin/mass-message": () => requireAdmin(showMassMessagePage),
  "/admin/maintenance": () => requireAdmin(showMaintenancePage),
  "/admin/user-roles": () => requireAdmin(showUserRolesPage),
  "/admin/reports": () => requireAdmin(showReportsPage),
  "/admin/verification": () => requireAdmin(showVerificationPage),
  "/admin/preview": () => requireAdmin(showPreviewPage),
};

function showLoginPage() {
  if (currentUser) {
    navigateTo("/");
    return;
  }
  signupCard.hidden = true;
  loginCard.hidden = false;
  blackScreen.hidden = true;
  homeScreen.hidden = true;
  hideAllPages();
}

function showSignupPage() {
  if (currentUser) {
    navigateTo("/");
    return;
  }
  signupCard.hidden = false;
  loginCard.hidden = true;
  blackScreen.hidden = true;
  homeScreen.hidden = true;
  hideAllPages();
}

function requireAdmin(showFn) {
  if (!currentUser) {
    navigateTo("/login");
    return;
  }
  if (!currentUser.isAdmin) {
    navigateTo("/");
    return;
  }
  showFn();
}

function navigateTo(path) {
  history.pushState({ path }, "", path);
  handleRoute();
}

function handleRoute() {
  const path = window.location.pathname;

  // Public routes that don't require auth
  const publicRoutes = ["/", "/login", "/signup", "/avatar"];
  const isPublicRoute = publicRoutes.includes(path) || path.startsWith("/search");

  // If not logged in and trying to access protected route, redirect to login
  if (!currentUser && !isPublicRoute) {
    if (path !== "/login") {
      history.replaceState({ path }, "", "/login");
    }
    showLoginPage();
    return;
  }

  const showFn = ROUTES[path];
  if (showFn) {
    showFn();
  } else if (path.startsWith("/profile/")) {
    const userId = path.split("/")[2];
    showProfilePage(userId);
  } else if (path.startsWith("/item/")) {
    const itemId = path.split("/")[2];
    openItemPage(itemId);
  } else {
    hideAllPages();
    homeDefaultContent.hidden = false;
  }
}

window.addEventListener("popstate", handleRoute);

const settingsPage = document.querySelector("#settings-page");
const premiumStatus = document.querySelector("#premium-status");
const premiumPage = document.querySelector("#premium-page");
const settingsUsername = document.querySelector("#settings-username");
const settingsDisplayName = document.querySelector("#settings-display-name");
const editUsernameButton = document.querySelector("#edit-username-button");
const usernameEditor = document.querySelector("#username-editor");
const newUsernameInput = document.querySelector("#new-username");
const usernamePasswordInput = document.querySelector("#username-password");
const saveUsernameButton = document.querySelector("#save-username");
const editDisplayNameButton = document.querySelector("#edit-display-name-button");
const displayNameEditor = document.querySelector("#display-name-editor");
const newDisplayNameInput = document.querySelector("#new-display-name");
const saveDisplayNameButton = document.querySelector("#save-display-name");
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

function showBanOverlay(reason) {
  const overlay = document.getElementById("ban-overlay");
  const reasonEl = document.getElementById("ban-reason");
  const dateEl = document.getElementById("ban-review-date");
  if (reasonEl) reasonEl.textContent = reason || "No reason provided.";
  if (dateEl) dateEl.textContent = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  if (overlay) {
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
  }
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
  const isAvatarUser = (user.username || "").toLowerCase() === "marsargo";
  avatarNavButton.hidden = !isAvatarUser;
  avatarNavButton.style.display = isAvatarUser ? "" : "none";
  if (!isAvatarUser) {
    avatarPage.hidden = true;
  }
  const isBanManager = user.isAdmin && (user.username || "").toLowerCase() === "marsargo";
  banManagerNavButton.hidden = !isBanManager;
  banManagerNavButton.style.display = isBanManager ? "" : "none";
  userSearchNavButton.hidden = !isBanManager;
  userSearchNavButton.style.display = isBanManager ? "" : "none";
  serverStatsNavButton.hidden = !isBanManager;
  serverStatsNavButton.style.display = isBanManager ? "" : "none";
  announcementsNavButton.hidden = !isBanManager;
  announcementsNavButton.style.display = isBanManager ? "" : "none";
  giveItemsNavButton.hidden = !isBanManager;
  giveItemsNavButton.style.display = isBanManager ? "" : "none";
  resetPasswordNavButton.hidden = !isBanManager;
  resetPasswordNavButton.style.display = isBanManager ? "" : "none";
  changeUsernameNavButton.hidden = !isBanManager;
  changeUsernameNavButton.style.display = isBanManager ? "" : "none";
  auditLogNavButton.hidden = !isBanManager;
  auditLogNavButton.style.display = isBanManager ? "" : "none";
  massMessageNavButton.hidden = !isBanManager;
  massMessageNavButton.style.display = isBanManager ? "" : "none";
  maintenanceNavButton.hidden = !isBanManager;
  maintenanceNavButton.style.display = isBanManager ? "" : "none";
  userRolesNavButton.hidden = !isBanManager;
  userRolesNavButton.style.display = isBanManager ? "" : "none";
  reportsNavButton.hidden = !isBanManager;
  reportsNavButton.style.display = isBanManager ? "" : "none";
  verificationNavButton.hidden = !isBanManager;
  verificationNavButton.style.display = isBanManager ? "" : "none";
  adminPreviewCard.hidden = !isBanManager;
  adminPreviewCard.style.display = isBanManager ? "" : "none";
  if (!isBanManager) {
    banManagerPage.hidden = true;
    userSearchPage.hidden = true;
    serverStatsPage.hidden = true;
    announcementsPage.hidden = true;
    giveItemsPage.hidden = true;
    resetPasswordPage.hidden = true;
    changeUsernamePage.hidden = true;
    auditLogPage.hidden = true;
    massMessagePage.hidden = true;
    maintenancePage.hidden = true;
    userRolesPage.hidden = true;
    reportsPage.hidden = true;
    verificationPage.hidden = true;
    previewPage.hidden = true;
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
  void refreshCurrentUser().then(async () => {
    await initSmallAvatars();
    navigateTo("/");
  });
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
  void initSmallAvatars();
}

async function fetchMe() {
  try {
    const response = await fetch(`${apiBase}/api/me`, { credentials: "same-origin" });
    if (response.status === 403) {
      const result = await response.json();
      if (result.banned) {
        showBanOverlay(result.ban_reason || "");
        return null;
      }
    }
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

async function checkMaintenance() {
  try {
    const response = await fetch("/api/maintenance");
    if (!response.ok) return;
    const data = await response.json();
    if (data.ok && data.maintenanceMode) {
      const user = await fetchMe();
      if (user && user.username && user.username.toLowerCase() === "marsargo") {
        return;
      }
      const overlay = document.querySelector("#maintenance-overlay");
      if (overlay) {
        overlay.hidden = false;
        document.body.style.overflow = "hidden";
      }
    }
  } catch (error) {
    console.error("Could not check maintenance status:", error);
  }
}

async function initializeSession() {
  await checkMaintenance();
  const user = await fetchMe();
  if (user) {
    currentUser = user;
    displayUser(user);
    enterHomeInstant();
    handleRoute();
    await initSmallAvatars();
    return;
  }
  if (user === null) {
    localStorage.removeItem("xedraUsername");
    applyTheme("xeon");
    handleRoute();
    return;
  }
  restoreHomeScreen();
  handleRoute();
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
  history.replaceState({ path: `/${view}` }, "", `/${view}`);
}

loginButton.addEventListener("click", () => {
  const openingLogin = loginCard.hidden;
  navigateTo(openingLogin ? "/login" : "/signup");
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
      if (result.banned) {
        showBanOverlay(result.ban_reason || "");
        return;
      }
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
  navigateTo("/signup");
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
  navigateTo("/login");
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
  hideAllPages();
  homeDefaultContent.hidden = false;
}

function createPlayerResultCard(user) {
  const card = document.createElement("div");
  card.className = "player-result-card";

  const head = document.createElement("div");
  head.className = "player-result-head";
  const avatarContainer = document.createElement("div");
  avatarContainer.className = "player-avatar-3d";
  avatarContainer.id = `player-avatar-${user.id}`;
  const text = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = user.username;
  const status = document.createElement("span");
  status.textContent = "Offline";
  text.append(name, status);
  head.append(avatarContainer, text);

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

  card.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    navigateTo(`/profile/${user.id}`);
  });

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
  hideAllPages();
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
    users.forEach((user) => {
      searchResultsGrid.appendChild(createPlayerResultCard(user));
      void initPlayerAvatar(user.id);
    });
  } catch {
    searchResultsCount.textContent = "The server is not running. Start it with: node server.js";
  }
}

playerSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const q = playerSearchInput.value.trim();
    if (q) {
      navigateTo(`/search?q=${encodeURIComponent(q)}`);
    } else {
      navigateTo("/");
    }
  }
});
playerSearchInput.addEventListener("search", () => {
  if (!playerSearchInput.value.trim()) {
    navigateTo("/");
  }
});

const homeNavButton = document.querySelector("#home-nav-button");
homeNavButton.addEventListener("click", () => {
  playerSearchInput.value = "";
  navigateTo("/");
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
    if (response.status === 403 && result.banned) {
      showBanOverlay(result.ban_reason || "");
      return { ok: false, result };
    }
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
    if (response.status === 403 && result.banned) {
      showBanOverlay(result.ban_reason || "");
      return { ok: false, result };
    }
    return { ok: response.ok, result };
  } catch {
    return { ok: false, result: { error: "The server is not running. Start it with: node server.js" } };
  }
}

const friendsNavButton = document.querySelector("#friends-nav-button");
const supportNavButton = document.querySelector("#support-nav-button");
const messagesNavButton = document.querySelector("#messages-nav-button");
const messagesPage = document.querySelector("#messages-page");
const messagesTabs = Array.from(document.querySelectorAll(".messages-tab"));
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
  hideAllPages();
  friendsPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadFriendsPage();
}

friendsNavButton.addEventListener("click", () => navigateTo("/friends"));

supportNavButton.addEventListener("click", () => navigateTo("/support"));

messagesNavButton.addEventListener("click", () => navigateTo("/messages"));

messagesTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    messagesTabs.forEach((item) => item.classList.toggle("active", item === tab));
  });
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
const catalogPagination = document.querySelector("#catalog-pagination");
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
  sort: "relevance",
  page: 1
};

const CATALOG_PER_PAGE = 20;

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
  hideAllPages();
  catalogPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadCatalog();
}

catalogNavButton.addEventListener("click", () => navigateTo("/catalog"));
topMarketplaceButton.addEventListener("click", () => navigateTo("/catalog"));

catalogCategories.forEach((button) => {
  button.addEventListener("click", () => {
    catalogCategories.forEach((item) => item.classList.toggle("active", item === button));
    catalogState.category = button.dataset.category;
    catalogState.page = 1;
    void loadCatalog();
  });
});

catalogGenreList.addEventListener("change", (event) => {
  if (event.target.name === "catalog-genre") {
    catalogState.genre = event.target.value;
    catalogState.page = 1;
    void loadCatalog();
  }
});

document.querySelectorAll('input[name="catalog-creator"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    catalogState.creator = radio.value;
    catalogCreatorName.value = "";
    catalogState.page = 1;
    void loadCatalog();
  });
});

document.querySelector("#catalog-creator-go").addEventListener("click", () => {
  catalogState.creator = catalogCreatorName.value.trim();
  document.querySelectorAll('input[name="catalog-creator"]').forEach((radio) => {
    radio.checked = radio.value === "" && !catalogState.creator;
  });
  catalogState.page = 1;
  void loadCatalog();
});

document.querySelectorAll('input[name="catalog-creator-type"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    catalogState.creatorType = radio.value;
    catalogState.page = 1;
    void loadCatalog();
  });
});

document.querySelectorAll('input[name="catalog-currency"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    catalogState.currency = radio.value;
    catalogState.page = 1;
    void loadCatalog();
  });
});

document.querySelectorAll('input[name="catalog-price"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    catalogState.priceMode = radio.value === "free" ? "free" : "any";
    catalogState.page = 1;
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
  catalogState.page = 1;
  void loadCatalog();
});

document.querySelectorAll('input[name="catalog-unavailable"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    catalogState.includeUnavailable = radio.value === "show";
    catalogState.page = 1;
    void loadCatalog();
  });
});

catalogSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    catalogState.q = catalogSearch.value.trim();
    catalogState.page = 1;
    void loadCatalog();
  }
});
catalogSearch.addEventListener("search", () => {
  if (!catalogSearch.value.trim()) {
    catalogState.q = "";
    catalogState.page = 1;
    void loadCatalog();
  }
});

catalogSort.addEventListener("change", () => {
  catalogState.sort = catalogSort.value;
  catalogState.page = 1;
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
  navigateTo(`/item/${result.itemId}`);
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
  if (catalogState.page > 1) {
    params.set("page", String(catalogState.page));
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
  card.addEventListener("click", () => navigateTo(`/item/${item.id}`));
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
  const startIndex = (catalogState.page - 1) * CATALOG_PER_PAGE + 1;
  catalogCount.textContent = total === 0
    ? "0 Results"
    : `${startIndex} - ${startIndex + items.length - 1} of ${total} Result${total === 1 ? "" : "s"}`;
  catalogGrid.textContent = "";
  renderCatalogPagination(total);
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

function renderCatalogPagination(total) {
  catalogPagination.textContent = "";
  const totalPages = Math.ceil(total / CATALOG_PER_PAGE);
  if (totalPages <= 1) {
    return;
  }
  const makeButton = (label, page, { disabled = false, active = false } = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "catalog-page-button" + (active ? " active" : "");
    button.textContent = label;
    button.disabled = disabled;
    if (!disabled && !active) {
      button.addEventListener("click", () => {
        catalogState.page = page;
        void loadCatalog();
        homeScreen.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    catalogPagination.appendChild(button);
  };
  makeButton("‹", catalogState.page - 1, { disabled: catalogState.page <= 1 });
  const start = Math.max(1, Math.min(catalogState.page - 4, totalPages - 8));
  const end = Math.min(totalPages, start + 8);
  if (start > 1) {
    makeButton("1", 1);
    if (start > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "catalog-page-ellipsis";
      ellipsis.textContent = "…";
      catalogPagination.appendChild(ellipsis);
    }
  }
  for (let page = start; page <= end; page += 1) {
    makeButton(String(page), page, { active: page === catalogState.page });
  }
  if (end < totalPages) {
    if (end < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "catalog-page-ellipsis";
      ellipsis.textContent = "…";
      catalogPagination.appendChild(ellipsis);
    }
    makeButton(String(totalPages), totalPages);
  }
  makeButton("›", catalogState.page + 1, { disabled: catalogState.page >= totalPages });
}

const inventoryNavButton = document.querySelector("#inventory-nav-button");
const inventoryPage = document.querySelector("#inventory-page");
const inventoryTitle = document.querySelector("#inventory-title");
const inventorySearch = document.querySelector("#inventory-search");
const inventoryCount = document.querySelector("#inventory-count");
const inventoryGrid = document.querySelector("#inventory-grid");
const inventoryPagination = document.querySelector("#inventory-pagination");

const INVENTORY_PER_PAGE = 24;
const inventoryState = { q: "", page: 1 };
let inventoryItems = [];

function showInventoryPage() {
  hideAllPages();
  inventoryPage.hidden = false;
  inventoryTitle.textContent = `${currentUser ? currentUser.username : "User"}'s Inventory`;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadInventory();
}

inventoryNavButton.addEventListener("click", () => navigateTo("/inventory"));

inventorySearch.addEventListener("input", () => {
  inventoryState.q = inventorySearch.value.trim().toLowerCase();
  inventoryState.page = 1;
  renderInventory();
});

async function loadInventory() {
  inventoryCount.textContent = "Loading...";
  inventoryGrid.textContent = "";
  inventoryPagination.hidden = true;
  inventoryPagination.textContent = "";
  const { ok, result } = await apiCall("GET", "/api/inventory");
  if (!ok) {
    inventoryItems = [];
    inventoryCount.textContent = result.error || "Could not load inventory.";
    return;
  }
  inventoryItems = result.items || [];
  renderInventory();
}

function renderInventory() {
  const query = inventoryState.q;
  const filtered = query
    ? inventoryItems.filter((item) => (item.name || "").toLowerCase().includes(query))
    : inventoryItems;
  const totalPages = Math.max(1, Math.ceil(filtered.length / INVENTORY_PER_PAGE));
  if (inventoryState.page > totalPages) {
    inventoryState.page = totalPages;
  }
  const startIndex = (inventoryState.page - 1) * INVENTORY_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + INVENTORY_PER_PAGE);
  if (inventoryItems.length === 0) {
    inventoryCount.textContent = "You don't have any items yet.";
  } else if (filtered.length === 0) {
    inventoryCount.textContent = "No items match your search.";
  } else {
    inventoryCount.textContent = `Showing ${startIndex + 1} to ${startIndex + pageItems.length} of ${filtered.length}`;
  }
  inventoryGrid.textContent = "";
  pageItems.forEach((item) => inventoryGrid.appendChild(createInventoryItemCard(item)));
  renderInventoryPagination(totalPages, filtered.length);
}

function renderInventoryPagination(totalPages, shownCount) {
  inventoryPagination.textContent = "";
  if (shownCount === 0) {
    inventoryPagination.hidden = true;
    return;
  }
  inventoryPagination.hidden = false;
  const goTo = (page) => {
    inventoryState.page = page;
    renderInventory();
    homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  };
  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "inventory-page-arrow";
  prev.textContent = "‹";
  prev.disabled = inventoryState.page <= 1;
  prev.addEventListener("click", () => goTo(inventoryState.page - 1));
  const label = document.createElement("span");
  label.className = "inventory-page-label";
  label.textContent = `Page ${inventoryState.page} of ${totalPages}`;
  const next = document.createElement("button");
  next.type = "button";
  next.className = "inventory-page-arrow";
  next.textContent = "›";
  next.disabled = inventoryState.page >= totalPages;
  next.addEventListener("click", () => goTo(inventoryState.page + 1));
  inventoryPagination.append(prev, label, next);
}

function createInventoryItemCard(item) {
  const card = document.createElement("div");
  card.className = "catalog-item inventory-item";
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
  if (item.isLimited || item.isLimitedUnique) {
    const ribbon = document.createElement("span");
    ribbon.className = "inventory-limited-ribbon";
    ribbon.textContent = "LIMITED";
    thumb.appendChild(ribbon);
  }
  const body = document.createElement("div");
  body.className = "catalog-item-body";
  const name = document.createElement("p");
  name.className = "catalog-item-name";
  name.textContent = item.name;
  name.title = item.name;
  body.appendChild(name);
  const creator = document.createElement("p");
  creator.className = "inventory-item-creator";
  creator.textContent = "By ";
  const creatorName = document.createElement("span");
  creatorName.className = "creator-name";
  creatorName.textContent = item.creatorName || "Unknown";
  creator.appendChild(creatorName);
  body.appendChild(creator);
  card.append(thumb, body);
  card.addEventListener("click", () => navigateTo(`/item/${item.id}`));
  return card;
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
  settingsDisplayName.textContent = user.displayName || user.username;
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

async function showSettingsPage() {
  const user = await fetchMe();
  if (!user) {
    return;
  }
  currentUser = user;
  displayUser(user);
  populateSettings(user);
  accountMenu.hidden = true;
  hideAllPages();
  settingsPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
}

function showPremiumPage() {
  hideAllPages();
  premiumPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  updatePremiumUI();
}

const downloadPage = document.querySelector("#download-page");
const downloadNavButton = document.querySelector("#download-nav-button");
const downloadGetAppButton = document.querySelector("#download-get-app-button");

function showDownloadPage() {
  hideAllPages();
  downloadPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
}

downloadNavButton.addEventListener("click", () => navigateTo("/download"));

downloadGetAppButton.addEventListener("click", () => {
  downloadGetAppButton.textContent = "Coming soon...";
  downloadGetAppButton.disabled = true;
  window.setTimeout(() => {
    downloadGetAppButton.textContent = "Get App";
    downloadGetAppButton.disabled = false;
  }, 2000);
});

const transactionsPage = document.querySelector("#transactions-page");
const transactionsTabs = document.querySelectorAll(".transactions-tab");
const transactionsPanels = {
  "my-transactions": document.querySelector("#transactions-my-transactions"),
  "summary": document.querySelector("#transactions-summary"),
  "trade-currency": document.querySelector("#transactions-trade-currency")
};
const transactionTypeSelect = document.querySelector("#transaction-type-select");
const transactionsTableBody = document.querySelector("#transactions-table-body");
const summaryPeriodSelect = document.querySelector("#summary-period-select");
const summaryTableBody = document.querySelector("#summary-table-body");
const summaryTotalAmount = document.querySelector("#summary-total-amount");
const robuxBalanceButton = document.querySelector("#robux-balance-button");

function showTransactionsPage() {
  hideAllPages();
  transactionsPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadTransactions();
}

robuxBalanceButton.addEventListener("click", () => navigateTo("/transactions"));

transactionsTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    transactionsTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    Object.values(transactionsPanels).forEach((panel) => { panel.hidden = true; });
    transactionsPanels[target].hidden = false;
    if (target === "summary") {
      void loadSummary();
    }
  });
});

transactionTypeSelect.addEventListener("change", () => {
  void loadTransactions();
});

summaryPeriodSelect.addEventListener("change", () => {
  void loadSummary();
});

async function loadTransactions() {
  transactionsTableBody.innerHTML = '<tr><td colspan="4" class="transactions-empty">Loading...</td></tr>';
  const type = transactionTypeSelect.value;
  const { ok, result } = await apiCall("GET", `/api/transactions?type=${encodeURIComponent(type)}`);
  if (!ok) {
    transactionsTableBody.innerHTML = '<tr><td colspan="4" class="transactions-empty">Could not load transactions.</td></tr>';
    return;
  }
  const transactions = result.transactions || [];
  if (transactions.length === 0) {
    const emptyMessage = type === "purchases"
      ? "You have not purchased any items! Browse the Catalog to buy items."
      : type === "sales"
      ? "You have not sold any items."
      : type === "trades"
      ? "You have no trade history."
      : "No premium transactions found.";
    transactionsTableBody.innerHTML = `<tr><td colspan="4" class="transactions-empty">${emptyMessage}</td></tr>`;
    return;
  }
  transactionsTableBody.innerHTML = "";
  transactions.forEach((tx) => {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    dateCell.textContent = tx.date ? new Date(tx.date).toLocaleDateString() : "";
    const memberCell = document.createElement("td");
    memberCell.textContent = tx.member || "";
    const descCell = document.createElement("td");
    descCell.textContent = tx.description || "";
    const amountCell = document.createElement("td");
    amountCell.textContent = tx.amount != null ? (tx.amount < 0 ? tx.amount : `+${tx.amount}`) : "";
    row.append(dateCell, memberCell, descCell, amountCell);
    transactionsTableBody.appendChild(row);
  });
}

async function loadSummary() {
  summaryTableBody.innerHTML = '<tr><td colspan="2" class="transactions-empty">Loading...</td></tr>';
  summaryTotalAmount.textContent = "0";
  const period = summaryPeriodSelect.value;
  const { ok, result } = await apiCall("GET", `/api/transactions/summary?period=${encodeURIComponent(period)}`);
  if (!ok) {
    summaryTableBody.innerHTML = '<tr><td colspan="2" class="transactions-empty">Could not load summary.</td></tr>';
    return;
  }
  const categories = result.categories || [];
  if (categories.length === 0) {
    summaryTableBody.innerHTML = '<tr><td colspan="2" class="transactions-empty">No transactions in this period.</td></tr>';
    summaryTotalAmount.textContent = "0";
    return;
  }
  summaryTableBody.innerHTML = "";
  let total = 0;
  categories.forEach((cat) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = cat.name || "";
    const creditCell = document.createElement("td");
    creditCell.textContent = cat.credit != null ? cat.credit : "";
    row.append(nameCell, creditCell);
    summaryTableBody.appendChild(row);
    if (cat.credit != null) {
      total += Number(cat.credit);
    }
  });
  summaryTotalAmount.textContent = total;
}

const tradesPage = document.querySelector("#trades-page");
const tradesNavButton = document.querySelector("#trades-nav-button");
const tradesDirectionSelect = document.querySelector("#trades-direction-select");
const tradesList = document.querySelector("#trades-list");

function showTradesPage() {
  hideAllPages();
  tradesPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadTrades();
}

tradesNavButton.addEventListener("click", () => navigateTo("/trades"));

tradesDirectionSelect.addEventListener("change", () => {
  void loadTrades();
});

async function loadTrades() {
  tradesList.innerHTML = '<p class="trades-empty">Loading...</p>';
  const direction = tradesDirectionSelect.value;
  const { ok, result } = await apiCall("GET", `/api/trades?direction=${encodeURIComponent(direction)}`);
  if (!ok) {
    tradesList.innerHTML = '<p class="trades-empty">Could not load trades.</p>';
    return;
  }
  const trades = result.trades || [];
  if (trades.length === 0) {
    const emptyMessage = direction === "inbound"
      ? "You have no inbound trade requests."
      : "You have no outbound trade requests.";
    tradesList.innerHTML = `<p class="trades-empty">${emptyMessage}</p>`;
    return;
  }
  tradesList.innerHTML = "";
  trades.forEach((trade) => {
    const tradeCard = document.createElement("div");
    tradeCard.className = "trade-card";
    const header = document.createElement("div");
    header.className = "trade-header";
    const userSpan = document.createElement("span");
    userSpan.className = "trade-user";
    userSpan.textContent = trade.username || "Unknown User";
    const dateSpan = document.createElement("span");
    dateSpan.className = "trade-date";
    dateSpan.textContent = trade.created_at ? new Date(trade.created_at).toLocaleDateString() : "";
    header.append(userSpan, dateSpan);
    const items = document.createElement("div");
    items.className = "trade-items";
    (trade.items || []).forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "trade-item";
      const thumb = document.createElement("div");
      thumb.className = "trade-item-thumb";
      if (item.thumbnail_url) {
        const img = document.createElement("img");
        img.src = item.thumbnail_url;
        img.alt = item.name;
        thumb.appendChild(img);
      } else {
        thumb.textContent = (item.name || "?").charAt(0);
      }
      const name = document.createElement("span");
      name.className = "trade-item-name";
      name.textContent = item.name || "Unknown Item";
      itemDiv.append(thumb, name);
      items.appendChild(itemDiv);
    });
    const actions = document.createElement("div");
    actions.className = "trade-actions";
    if (direction === "inbound") {
      const acceptBtn = document.createElement("button");
      acceptBtn.className = "trade-accept-button";
      acceptBtn.type = "button";
      acceptBtn.textContent = "Accept Trade";
      acceptBtn.addEventListener("click", () => handleTradeAction(trade.id, "accept"));
      const declineBtn = document.createElement("button");
      declineBtn.className = "trade-decline-button";
      declineBtn.type = "button";
      declineBtn.textContent = "Decline";
      declineBtn.addEventListener("click", () => handleTradeAction(trade.id, "decline"));
      actions.append(acceptBtn, declineBtn);
    } else {
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "trade-cancel-button";
      cancelBtn.type = "button";
      cancelBtn.textContent = "Cancel Trade";
      cancelBtn.addEventListener("click", () => handleTradeAction(trade.id, "cancel"));
      actions.appendChild(cancelBtn);
    }
    tradeCard.append(header, items, actions);
    tradesList.appendChild(tradeCard);
  });
}

async function handleTradeAction(tradeId, action) {
  const { ok, result } = await apiCall("POST", "/api/trades/action", { trade_id: tradeId, action });
  if (ok) {
    void loadTrades();
  } else {
    alert(result.error || "Trade action failed.");
  }
}

function updatePremiumUI() {
  const currentTier = currentUser?.premiumTier || "";
  const timerStart = currentUser?.premiumTimerStart ? new Date(currentUser.premiumTimerStart) : null;
  const tierMap = { classic: "Classic", turbo: "Turbo", outrageous: "Outrageous" };
  const robuxMap = { classic: 40, turbo: 90, outrageous: 120 };

  document.querySelectorAll(".tier-button").forEach((button) => {
    const btnTier = button.dataset.tier;
    if (btnTier === currentTier) {
      button.disabled = true;
      button.textContent = "Current Plan";
    } else {
      button.disabled = false;
      button.textContent = `Get ${tierMap[btnTier] || btnTier}`;
    }
  });

  if (premiumStatus) {
    if (currentTier && timerStart) {
      const nextPayout = new Date(timerStart.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const msLeft = nextPayout - now;
      if (msLeft > 0) {
        const hours = Math.floor(msLeft / (60 * 60 * 1000));
        const minutes = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
        premiumStatus.textContent = `${tierMap[currentTier]} active — next payout of R$${robuxMap[currentTier]} in ${hours}h ${minutes}m`;
      } else {
        premiumStatus.textContent = `${tierMap[currentTier]} active — payout processing soon`;
      }
    } else {
      premiumStatus.textContent = "";
    }
  }
}

openSettingsButton.addEventListener("click", () => {
  navigateTo("/settings");
});

premiumButton.addEventListener("click", () => navigateTo("/premium"));

document.querySelectorAll(".tier-button:not(:disabled)").forEach((button) => {
  button.addEventListener("click", async () => {
    const tier = button.dataset.tier;
    if (!tier) return;
    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = "Activating...";
    const { ok, result } = await apiCall("POST", "/api/premium/activate", { tier });
    if (ok) {
      currentUser.premiumTier = tier;
      currentUser.premiumTimerStart = new Date().toISOString();
      if (premiumStatus) {
        premiumStatus.textContent = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Premium activated! You'll receive R$${result.robuxPerDay} every 24 hours.`;
      }
      updatePremiumUI();
    } else {
      button.disabled = false;
      button.textContent = oldText;
      if (premiumStatus) premiumStatus.textContent = result.error || "Could not activate premium.";
    }
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    accountMenu.hidden = true;
  }
});

editUsernameButton.addEventListener("click", () => {
  usernameEditor.hidden = !usernameEditor.hidden;
  if (!usernameEditor.hidden) {
    newUsernameInput.focus();
  }
});
editDisplayNameButton.addEventListener("click", () => {
  displayNameEditor.hidden = !displayNameEditor.hidden;
  if (!displayNameEditor.hidden) {
    newDisplayNameInput.focus();
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

saveDisplayNameButton.addEventListener("click", async () => {
  const newDisplayName = newDisplayNameInput.value.trim();
  if (newDisplayName.length < 1 || newDisplayName.length > 20) {
    setStatus(accountStatus, "Display name must be 1-20 characters.", true);
    return;
  }
  setStatus(accountStatus, "Saving display name...");
  const { ok, result } = await apiPut("/api/me/display-name", { newDisplayName });
  if (!ok) {
    setStatus(accountStatus, result.error || "Could not change your display name.", true);
    return;
  }
  currentUser.displayName = result.user.display_name || newDisplayName;
  newDisplayNameInput.value = "";
  displayNameEditor.hidden = true;
  setStatus(accountStatus, "Display name changed.");
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
const adminUpdateAssetType = document.querySelector("#admin-update-asset-type");
const adminUpdateModel = document.querySelector("#admin-update-model");
const adminDeleteCode = document.querySelector("#admin-delete-code");
const adminDeleteButton = document.querySelector("#admin-delete-button");
const adminRefundButton = document.querySelector("#admin-refund-button");
const adminDeleteStatus = document.querySelector("#admin-delete-status");
const adminCodesList = document.querySelector("#admin-codes-list");
const adminPendingList = document.querySelector("#admin-pending-list");
const adminAcceptStatus = document.querySelector("#admin-accept-status");
const adminRobuxUsername = document.querySelector("#admin-robux-username");
const adminRobuxAmount = document.querySelector("#admin-robux-amount");
const adminRobuxButton = document.querySelector("#admin-robux-button");
const adminRobuxStatus = document.querySelector("#admin-robux-status");
const adminRobuxHistoryList = document.querySelector("#admin-robux-history-list");

const itemPage = document.querySelector("#item-page");
const itemDetail = document.querySelector("#item-detail");
const itemBackButton = document.querySelector("#item-back-button");

function showAdminPage() {
  hideAllPages();
  adminPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadAdminCodes();
  void loadPendingAssets();
  void loadRobuxHistory();
}

adminNavButton.addEventListener("click", () => navigateTo("/admin"));

const banManagerNavButton = document.querySelector("#ban-manager-nav-button");
const banManagerPage = document.querySelector("#ban-manager-page");
const banManagerUser = document.querySelector("#ban-manager-user");
const banManagerReason = document.querySelector("#ban-manager-reason");
const banManagerDuration = document.querySelector("#ban-manager-duration");
const banManagerBanButton = document.querySelector("#ban-manager-ban-button");
const banManagerStatus = document.querySelector("#ban-manager-status");
const banManagerList = document.querySelector("#ban-manager-list");

function showBanManagerPage() {
  hideAllPages();
  banManagerPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadBanManagerUsers();
}

banManagerNavButton.addEventListener("click", () => navigateTo("/admin/bans"));

async function loadBanManagerUsers() {
  const { ok, result } = await apiCall("GET", "/api/ban-manager/users");
  if (!ok) {
    setStatus(banManagerStatus, result.error || "Could not load users.", true);
    return;
  }
  banManagerUser.innerHTML = '<option value="">Select a user...</option>';
  for (const user of result.users) {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.username;
    if (user.banned) {
      option.textContent += " (BANNED)";
    }
    banManagerUser.appendChild(option);
  }
  banManagerList.innerHTML = "";
  for (const user of result.users) {
    if (user.ban_count > 0 || user.banned) {
      const li = document.createElement("li");
      if (user.banned) {
        li.className = "banned";
      }
      const expiresText = user.ban_expires_at ? new Date(user.ban_expires_at).toLocaleString() : "Never";
      li.innerHTML = `<strong>${user.username}</strong> — Bans: ${user.ban_count || 0}${user.banned ? ` — Reason: ${user.ban_reason || "None"} — Expires: ${expiresText}` : " — Not banned"}`;
      banManagerList.appendChild(li);
    }
  }
}

banManagerBanButton.addEventListener("click", async () => {
  const userId = banManagerUser.value;
  const reason = banManagerReason.value.trim();
  const duration = Number(banManagerDuration.value);
  if (!userId) {
    setStatus(banManagerStatus, "Select a user.", true);
    return;
  }
  if (!reason) {
    setStatus(banManagerStatus, "Enter a reason.", true);
    return;
  }
  if (!Number.isInteger(duration) || duration <= 0) {
    setStatus(banManagerStatus, "Enter a valid duration in hours.", true);
    return;
  }
  banManagerBanButton.disabled = true;
  setStatus(banManagerStatus, "Banning user...");
  const { ok, result } = await apiCall("POST", "/api/ban-manager/ban", { userId, reason, durationHours: duration });
  banManagerBanButton.disabled = false;
  if (!ok) {
    setStatus(banManagerStatus, result.error || "Could not ban user.", true);
    return;
  }
  setStatus(banManagerStatus, `Banned ${result.username}. Ban count: ${result.banCount}. Expires: ${new Date(result.expiresAt).toLocaleString()}.`);
  banManagerReason.value = "";
  banManagerDuration.value = "";
  void loadBanManagerUsers();
});

const unbanManagerUser = document.querySelector("#unban-manager-user");
const unbanManagerButton = document.querySelector("#unban-manager-button");
const unbanManagerStatus = document.querySelector("#unban-manager-status");

async function loadBanManagerUsers() {
  const { ok, result } = await apiCall("GET", "/api/ban-manager/users");
  if (!ok) {
    setStatus(banManagerStatus, result.error || "Could not load users.", true);
    return;
  }
  banManagerUser.innerHTML = '<option value="">Select a user...</option>';
  unbanManagerUser.innerHTML = '<option value="">Select a banned user...</option>';
  for (const user of result.users) {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.username;
    if (user.banned) {
      option.textContent += " (BANNED)";
      const unbanOption = document.createElement("option");
      unbanOption.value = user.id;
      unbanOption.textContent = user.username;
      unbanManagerUser.appendChild(unbanOption);
    }
    banManagerUser.appendChild(option);
  }
  banManagerList.innerHTML = "";
  for (const user of result.users) {
    if (user.ban_count > 0 || user.banned) {
      const li = document.createElement("li");
      if (user.banned) {
        li.className = "banned";
      }
      const expiresText = user.ban_expires_at ? new Date(user.ban_expires_at).toLocaleString() : "Never";
      li.innerHTML = `<strong>${user.username}</strong> — Bans: ${user.ban_count || 0}${user.banned ? ` — Reason: ${user.ban_reason || "None"} — Expires: ${expiresText}` : " — Not banned"}`;
      banManagerList.appendChild(li);
    }
  }
}

unbanManagerButton.addEventListener("click", async () => {
  const userId = unbanManagerUser.value;
  if (!userId) {
    setStatus(unbanManagerStatus, "Select a banned user.", true);
    return;
  }
  unbanManagerButton.disabled = true;
  setStatus(unbanManagerStatus, "Unbanning user...");
  const { ok, result } = await apiCall("POST", "/api/ban-manager/unban", { userId });
  unbanManagerButton.disabled = false;
  if (!ok) {
    setStatus(unbanManagerStatus, result.error || "Could not unban user.", true);
    return;
  }
  setStatus(unbanManagerStatus, `Unbanned ${result.username}.`);
  unbanManagerUser.value = "";
  void loadBanManagerUsers();
});

const verificationNavButton = document.querySelector("#verification-nav-button");
const verificationPage = document.querySelector("#verification-page");
const verificationUser = document.querySelector("#verification-user");
const verificationVerifyButton = document.querySelector("#verification-verify-button");
const verificationStatus = document.querySelector("#verification-status");
const verificationList = document.querySelector("#verification-list");

function showVerificationPage() {
  hideAllPages();
  verificationPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadVerificationUsers();
}

verificationNavButton.addEventListener("click", () => navigateTo("/admin/verification"));

const adminPreviewCard = document.querySelector("#admin-preview-card");
const adminPreviewOpenButton = document.querySelector("#admin-preview-open");
const previewPage = document.querySelector("#preview-page");
const previewItemIdInput = document.querySelector("#preview-item-id");
const previewLoadButton = document.querySelector("#preview-load-button");
const previewStatus = document.querySelector("#preview-status");
const previewControlsCard = document.querySelector("#preview-controls-card");
const preview3dContainer = document.querySelector("#preview-3d-container");
const previewUpButton = document.querySelector("#preview-up-button");
const previewDownButton = document.querySelector("#preview-down-button");
const previewLeftButton = document.querySelector("#preview-left-button");
const previewRightButton = document.querySelector("#preview-right-button");
const previewBiggerButton = document.querySelector("#preview-bigger-button");
const previewSmallerButton = document.querySelector("#preview-smaller-button");
const previewRotateLeftButton = document.querySelector("#preview-rotate-left-button");
const previewRotateRightButton = document.querySelector("#preview-rotate-right-button");
const previewOffsetValue = document.querySelector("#preview-offset-value");
const previewXValue = document.querySelector("#preview-x-value");
const previewScaleValue = document.querySelector("#preview-scale-value");
const previewRotationValue = document.querySelector("#preview-rotation-value");
const previewConfirmRow = document.querySelector("#preview-confirm-row");
const previewYesButton = document.querySelector("#preview-yes-button");
const previewNoButton = document.querySelector("#preview-no-button");

adminPreviewOpenButton.addEventListener("click", () => navigateTo("/admin/preview"));

async function loadVerificationUsers() {
  const { ok, result } = await apiCall("GET", "/api/verification/users");
  if (!ok) {
    setStatus(verificationStatus, result.error || "Could not load users.", true);
    return;
  }
  verificationUser.innerHTML = '<option value="">Select a user...</option>';
  verificationList.innerHTML = "";
  for (const user of result.users) {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.username;
    if (user.verified) {
      option.textContent += " ✓";
    }
    verificationUser.appendChild(option);
    if (user.verified) {
      const li = document.createElement("li");
      li.className = "verified-user";
      li.innerHTML = `<strong>${user.username}</strong> ✓ <button class="button-ghost unverify-button" data-user-id="${user.id}" type="button">Unverify</button>`;
      verificationList.appendChild(li);
    }
  }
  verificationList.querySelectorAll(".unverify-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = button.dataset.userId;
      button.disabled = true;
      const { ok, result } = await apiCall("POST", "/api/verification/unverify", { userId });
      button.disabled = false;
      if (!ok) {
        setStatus(verificationStatus, result.error || "Could not unverify user.", true);
        return;
      }
      setStatus(verificationStatus, `Unverified ${result.username}.`);
      void loadVerificationUsers();
    });
  });
}

verificationVerifyButton.addEventListener("click", async () => {
  const userId = verificationUser.value;
  if (!userId) {
    setStatus(verificationStatus, "Select a user.", true);
    return;
  }
  verificationVerifyButton.disabled = true;
  setStatus(verificationStatus, "Verifying user...");
  const { ok, result } = await apiCall("POST", "/api/verification/verify", { userId });
  verificationVerifyButton.disabled = false;
  if (!ok) {
    setStatus(verificationStatus, result.error || "Could not verify user.", true);
    return;
  }
  setStatus(verificationStatus, `Verified ${result.username}.`);
  verificationUser.value = "";
  void loadVerificationUsers();
});

function showPreviewPage() {
  hideAllPages();
  previewPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
}

let previewRenderer = null;
let previewAnimationId = null;
let previewOrbitControls = null;
let previewItemOffset = 0;
let previewItemX = 0;
let previewItemScale = 1;
let previewItemRotation = 0;
let previewCurrentItem = null;
let previewItemModel = null;
let previewItemBaseY = 0;
let previewItemBaseX = 0;
let previewItemBaseScale = 1;
let previewItemBaseRot = 0;

previewLoadButton.addEventListener("click", async () => {
  const itemId = previewItemIdInput.value.trim();
  if (!itemId) {
    setStatus(previewStatus, "Enter an item ID.", true);
    return;
  }

  previewLoadButton.disabled = true;
  setStatus(previewStatus, "Loading item...");

  try {
    const response = await fetch(`${apiBase}/api/catalog/${itemId}`, { credentials: "same-origin" });
    const data = await response.json();
    if (!response.ok) {
      setStatus(previewStatus, data.error || "Item not found.", true);
      previewLoadButton.disabled = false;
      return;
    }

    previewCurrentItem = {
      id: data.item.id,
      name: data.item.name,
      assetType: data.item.assetType,
      modelUrl: data.item.modelUrl,
      yOffset: data.item.yOffset || 0,
      xOffset: data.item.xOffset || 0,
      scaleOffset: data.item.scaleOffset || 1,
      rotationOffset: data.item.rotationOffset || 0
    };
    previewItemOffset = 0;
    previewItemX = 0;
    previewItemScale = 1;
    previewItemRotation = 0;
    previewOffsetValue.textContent = "0";
    previewXValue.textContent = "0";
    previewScaleValue.textContent = "1.0";
    previewRotationValue.textContent = "0";
    previewControlsCard.hidden = false;
    previewConfirmRow.hidden = true;
    setStatus(previewStatus, `Loaded: ${data.name}`);
    initPreviewViewer(previewCurrentItem);
  } catch (error) {
    setStatus(previewStatus, "Failed to load item.", true);
  }
  previewLoadButton.disabled = false;
});

function initPreviewViewer(item) {
  if (!preview3dContainer || typeof THREE === "undefined") return;

  if (previewRenderer) {
    cancelAnimationFrame(previewAnimationId);
    if (previewRenderer.domElement.parentNode) {
      previewRenderer.domElement.parentNode.removeChild(previewRenderer.domElement);
    }
    previewRenderer.dispose();
    previewRenderer = null;
  }

  const width = preview3dContainer.clientWidth;
  const height = preview3dContainer.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1d21);
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  previewRenderer = new THREE.WebGLRenderer({ antialias: true });
  previewRenderer.setSize(width, height);
  previewRenderer.setPixelRatio(window.devicePixelRatio);
  preview3dContainer.appendChild(previewRenderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(3, 6, 5);
  scene.add(dirLight);

  if (previewOrbitControls) {
    previewOrbitControls.dispose();
    previewOrbitControls = null;
  }
  if (THREE.OrbitControls) {
    previewOrbitControls = new THREE.OrbitControls(camera, previewRenderer.domElement);
    previewOrbitControls.enableDamping = true;
    previewOrbitControls.dampingFactor = 0.08;
    previewOrbitControls.target.set(0, 1.2, 0);
    previewOrbitControls.minDistance = 2;
    previewOrbitControls.maxDistance = 15;
  }

  const character = new THREE.Group();
  const equippedGroup = new THREE.Group();
  equippedGroup.name = "equipped-items";
  scene.add(equippedGroup);
  scene.add(character);

  const GLTFLoader = THREE.GLTFLoader || window.GLTFLoader;
  if (!GLTFLoader) return;

  const loader = new GLTFLoader();
  loader.load("/r6.glb", (gltf) => {
    const model = gltf.scene;
    model.scale.set(1.5, 1.5, 1.5);
    model.position.y = -1;
    character.add(model);

    camera.position.set(0, 1.5, 6.5);
    camera.lookAt(0, 1.2, 0);

    if (item && item.modelUrl) {
      const itemLoader = new GLTFLoader();
      const cacheBustedUrl = item.modelUrl.includes("?") ? `${item.modelUrl}&t=${Date.now()}` : `${item.modelUrl}?t=${Date.now()}`;
      itemLoader.load(cacheBustedUrl, (itemGltf) => {
        const itemModel = itemGltf.scene;
        itemModel.name = `preview-item-${item.id}`;
        equippedGroup.add(itemModel);
        previewItemModel = itemModel;

        const avatarHead = findAvatarHead(character);
        if (avatarHead) {
          itemModel.updateMatrixWorld(true);
          const sourceBounds = new THREE.Box3().setFromObject(itemModel);
          const sourceSize = sourceBounds.getSize(new THREE.Vector3());
          if (sourceSize.x > 0) {
            const hatScale = Number(item.assetType) === 49
              ? avatarHead.size.x / 2 * 2.6
              : avatarHead.size.x / 2 * 0.85;
            itemModel.scale.multiplyScalar(hatScale);
            itemModel.updateMatrixWorld(true);
            const modelBounds = new THREE.Box3().setFromObject(itemModel);
            const modelCenter = modelBounds.getCenter(new THREE.Vector3());
            const headCenter = avatarHead.bounds.getCenter(new THREE.Vector3());
            itemModel.position.x += headCenter.x - modelCenter.x;
            if (Number(item.assetType) === 48) {
              itemModel.position.y += headCenter.y - modelCenter.y;
            } else if (Number(item.assetType) === 49) {
              itemModel.position.y += avatarHead.bounds.max.y - modelBounds.min.y + 0.1;
            } else {
              itemModel.position.y += avatarHead.bounds.max.y - modelBounds.min.y - 0.35;
            }
            itemModel.position.z += headCenter.z - modelCenter.z + 0.12;
            itemModel.rotation.y = Math.PI;
          }
        }
        if (item.id === 31) {
          itemModel.position.y -= 0.8;
        } else if (item.id === 33) {
          itemModel.position.z -= 0.3;
        } else if (item.id === 28) {
          itemModel.scale.multiplyScalar(0.92);
        }
        if (Number(item.yOffset)) {
          itemModel.position.y += Number(item.yOffset);
        }
        if (Number(item.xOffset)) {
          itemModel.position.x += Number(item.xOffset);
        }
        if (item.scaleOffset && item.scaleOffset !== 1) {
          itemModel.scale.multiplyScalar(item.scaleOffset);
        }
        if (Number(item.rotationOffset)) {
          itemModel.rotation.y += Number(item.rotationOffset) * Math.PI / 180;
        }
        previewItemBaseY = itemModel.position.y;
        previewItemBaseX = itemModel.position.x;
        previewItemBaseScale = itemModel.scale.x;
        previewItemBaseRot = itemModel.rotation.y;
      });
    }

    function animate() {
      previewAnimationId = requestAnimationFrame(animate);
      if (previewOrbitControls) previewOrbitControls.update();
      previewRenderer.render(scene, camera);
    }
    animate();
  });
}

function adjustPreview(mutate) {
  if (!previewCurrentItem) return;
  mutate();
  previewItemOffset = Math.round(previewItemOffset * 10) / 10;
  previewItemX = Math.round(previewItemX * 10) / 10;
  previewItemScale = Math.round(previewItemScale * 100) / 100;
  previewOffsetValue.textContent = previewItemOffset.toFixed(1);
  previewXValue.textContent = previewItemX.toFixed(1);
  previewScaleValue.textContent = previewItemScale.toFixed(2);
  previewRotationValue.textContent = String(previewItemRotation);
  applyPreviewOffset();
  previewConfirmRow.hidden = false;
}

previewUpButton.addEventListener("click", () => adjustPreview(() => { previewItemOffset += 0.1; }));
previewDownButton.addEventListener("click", () => adjustPreview(() => { previewItemOffset -= 0.1; }));
previewLeftButton.addEventListener("click", () => adjustPreview(() => { previewItemX -= 0.1; }));
previewRightButton.addEventListener("click", () => adjustPreview(() => { previewItemX += 0.1; }));
previewBiggerButton.addEventListener("click", () => adjustPreview(() => { previewItemScale += 0.1; }));
previewSmallerButton.addEventListener("click", () => adjustPreview(() => { previewItemScale -= 0.1; }));
previewRotateLeftButton.addEventListener("click", () => adjustPreview(() => { previewItemRotation += 15; }));
previewRotateRightButton.addEventListener("click", () => adjustPreview(() => { previewItemRotation -= 15; }));

function applyPreviewOffset() {
  if (!previewItemModel) return;
  previewItemModel.position.y = previewItemBaseY + previewItemOffset;
  previewItemModel.position.x = previewItemBaseX + previewItemX;
  const scale = previewItemBaseScale * previewItemScale;
  previewItemModel.scale.set(scale, scale, scale);
  previewItemModel.rotation.y = previewItemBaseRot + previewItemRotation * Math.PI / 180;
}

previewYesButton.addEventListener("click", async () => {
  if (!previewCurrentItem) return;
  previewYesButton.disabled = true;
  previewNoButton.disabled = true;
  const { ok, result } = await apiCall("PATCH", `/api/admin/catalog-items/${previewCurrentItem.id}/placement`, {
    yOffset: previewItemOffset,
    xOffset: previewItemX,
    scaleOffset: previewItemScale,
    rotationOffset: previewItemRotation
  });
  previewYesButton.disabled = false;
  previewNoButton.disabled = false;
  if (!ok) {
    setStatus(previewStatus, result.error || "Could not save placement.", true);
    return;
  }
  previewCurrentItem.yOffset = previewItemOffset;
  previewCurrentItem.xOffset = previewItemX;
  previewCurrentItem.scaleOffset = previewItemScale;
  previewCurrentItem.rotationOffset = previewItemRotation;
  setStatus(previewStatus, `Saved placement for ${previewCurrentItem.name}.`);
  previewConfirmRow.hidden = true;
  previewItemIdInput.value = "";
  void initSmallAvatars();
  void initWelcomePortrait();
});

previewNoButton.addEventListener("click", () => {
  previewItemOffset = 0;
  previewItemX = 0;
  previewItemScale = 1;
  previewItemRotation = 0;
  previewOffsetValue.textContent = "0";
  previewXValue.textContent = "0";
  previewScaleValue.textContent = "1.0";
  previewRotationValue.textContent = "0";
  applyPreviewOffset();
  previewConfirmRow.hidden = true;
  setStatus(previewStatus, "Reset to saved position.");
});

const userSearchNavButton = document.querySelector("#user-search-nav-button");
const userSearchPage = document.querySelector("#user-search-page");
const userSearchInput = document.querySelector("#user-search-input");
const userSearchButton = document.querySelector("#user-search-button");
const userSearchStatus = document.querySelector("#user-search-status");
const userSearchResult = document.querySelector("#user-search-result");
const userSearchDetails = document.querySelector("#user-search-details");

function showUserSearchPage() {
  hideAllPages();
  userSearchPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
}

userSearchNavButton.addEventListener("click", () => navigateTo("/admin/users"));

userSearchButton.addEventListener("click", async () => {
  const username = userSearchInput.value.trim();
  if (!username) {
    setStatus(userSearchStatus, "Enter a username.", true);
    return;
  }
  userSearchButton.disabled = true;
  setStatus(userSearchStatus, "Searching...");
  const { ok, result } = await apiCall("GET", `/api/admin/user-search?username=${encodeURIComponent(username)}`);
  userSearchButton.disabled = false;
  if (!ok) {
    setStatus(userSearchStatus, result.error || "Could not find user.", true);
    userSearchResult.hidden = true;
    return;
  }
  setStatus(userSearchStatus, "");
  userSearchResult.hidden = false;
  const user = result.user;
  const bannedStatus = user.banned ? `Yes - ${user.ban_reason || "No reason"} (Expires: ${user.ban_expires_at ? new Date(user.ban_expires_at).toLocaleString() : "Never"})` : "No";
  userSearchDetails.innerHTML = `
    <li><strong>Username:</strong> ${user.username}</li>
    <li><strong>ID:</strong> ${user.id}</li>
    <li><strong>Birthday:</strong> ${user.birthday || "Not set"}</li>
    <li><strong>Gender:</strong> ${user.gender || "Not set"}</li>
    <li><strong>Blurb:</strong> ${user.blurb || "None"}</li>
    <li><strong>Robux:</strong> ${user.robux}</li>
    <li><strong>Discord:</strong> ${user.discord_username || "Not linked"}</li>
    <li><strong>Banned:</strong> ${bannedStatus}</li>
    <li><strong>Ban Count:</strong> ${user.ban_count || 0}</li>
    <li><strong>Created:</strong> ${new Date(user.created_at).toLocaleString()}</li>
  `;
});

const serverStatsNavButton = document.querySelector("#server-stats-nav-button");
const serverStatsPage = document.querySelector("#server-stats-page");
const serverStatsList = document.querySelector("#server-stats-list");

function showServerStatsPage() {
  hideAllPages();
  serverStatsPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadServerStats();
}

serverStatsNavButton.addEventListener("click", () => navigateTo("/admin/stats"));

async function loadServerStats() {
  const { ok, result } = await apiCall("GET", "/api/admin/server-stats");
  if (!ok) {
    serverStatsList.innerHTML = `<li>Error: ${result.error || "Could not load stats."}</li>`;
    return;
  }
  const stats = result.stats;
  serverStatsList.innerHTML = `
    <li><strong>Total Users:</strong> ${stats.totalUsers}</li>
    <li><strong>Banned Users:</strong> ${stats.bannedUsers}</li>
    <li><strong>Active Sessions:</strong> ${stats.activeSessions}</li>
    <li><strong>Catalog Items:</strong> ${stats.catalogItems}</li>
    <li><strong>Creations:</strong> ${stats.creations}</li>
  `;
}

function hideAllPages() {
  homeDefaultContent.hidden = true;
  searchResultsSection.hidden = true;
  friendsPage.hidden = true;
  catalogPage.hidden = true;
  inventoryPage.hidden = true;
  itemPage.hidden = true;
  createPage.hidden = true;
  configurePage.hidden = true;
  avatarPage.hidden = true;
  adminPage.hidden = true;
  banManagerPage.hidden = true;
  userSearchPage.hidden = true;
  serverStatsPage.hidden = true;
  announcementsPage.hidden = true;
  giveItemsPage.hidden = true;
  resetPasswordPage.hidden = true;
  changeUsernamePage.hidden = true;
  auditLogPage.hidden = true;
  massMessagePage.hidden = true;
  maintenancePage.hidden = true;
  userRolesPage.hidden = true;
  reportsPage.hidden = true;
  messagesPage.hidden = true;
  verificationPage.hidden = true;
  previewPage.hidden = true;
  supportPage.hidden = true;
  profilePage.hidden = true;
  cleanupPortrait("profile-avatar-3d");
  cleanupPortrait("welcome-avatar-3d");
  premiumPage.hidden = true;
  downloadPage.hidden = true;
  transactionsPage.hidden = true;
  tradesPage.hidden = true;
  settingsPage.hidden = true;
}

const announcementsNavButton = document.querySelector("#announcements-nav-button");
const announcementsPage = document.querySelector("#announcements-page");
const announcementTitle = document.querySelector("#announcement-title");
const announcementMessage = document.querySelector("#announcement-message");
const announcementButton = document.querySelector("#announcement-button");
const announcementStatus = document.querySelector("#announcement-status");
const announcementsList = document.querySelector("#announcements-list");

function showAnnouncementsPage() {
  hideAllPages();
  announcementsPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadAnnouncements();
}

announcementsNavButton.addEventListener("click", () => navigateTo("/admin/announcements"));

announcementButton.addEventListener("click", async () => {
  const title = announcementTitle.value.trim();
  const message = announcementMessage.value.trim();
  if (!title || !message) {
    setStatus(announcementStatus, "Title and message are required.", true);
    return;
  }
  announcementButton.disabled = true;
  setStatus(announcementStatus, "Posting announcement...");
  const { ok, result } = await apiCall("POST", "/api/admin/announcements", { title, message });
  announcementButton.disabled = false;
  if (!ok) {
    setStatus(announcementStatus, result.error || "Could not post announcement.", true);
    return;
  }
  setStatus(announcementStatus, "Announcement posted!");
  announcementTitle.value = "";
  announcementMessage.value = "";
  void loadAnnouncements();
});

async function loadAnnouncements() {
  const { ok, result } = await apiCall("GET", "/api/admin/announcements");
  if (!ok) {
    announcementsList.innerHTML = `<li>${result.error || "Could not load announcements."}</li>`;
    return;
  }
  announcementsList.innerHTML = "";
  if (!result.announcements || result.announcements.length === 0) {
    announcementsList.innerHTML = "<li>No announcements yet.</li>";
    return;
  }
  for (const ann of result.announcements) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${ann.title}</strong><br/>${ann.message}<br/><small>${new Date(ann.created_at).toLocaleString()} by ${ann.author_username}</small>`;
    announcementsList.appendChild(li);
  }
}

const giveItemsNavButton = document.querySelector("#give-items-nav-button");
const giveItemsPage = document.querySelector("#give-items-page");
const giveItemsUsername = document.querySelector("#give-items-username");
const giveItemsCode = document.querySelector("#give-items-code");
const giveItemsButton = document.querySelector("#give-items-button");
const giveItemsStatus = document.querySelector("#give-items-status");

function showGiveItemsPage() {
  hideAllPages();
  giveItemsPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
}

giveItemsNavButton.addEventListener("click", () => navigateTo("/admin/give-items"));

giveItemsButton.addEventListener("click", async () => {
  const username = giveItemsUsername.value.trim();
  const code = Number(giveItemsCode.value);
  if (!username || !code) {
    setStatus(giveItemsStatus, "Username and item code are required.", true);
    return;
  }
  giveItemsButton.disabled = true;
  setStatus(giveItemsStatus, "Giving item...");
  const { ok, result } = await apiCall("POST", "/api/admin/give-items", { username, code });
  giveItemsButton.disabled = false;
  if (!ok) {
    setStatus(giveItemsStatus, result.error || "Could not give item.", true);
    return;
  }
  setStatus(giveItemsStatus, "Item given successfully!");
  giveItemsUsername.value = "";
  giveItemsCode.value = "";
});

const resetPasswordNavButton = document.querySelector("#reset-password-nav-button");
const resetPasswordPage = document.querySelector("#reset-password-page");
const resetPasswordUsername = document.querySelector("#reset-password-username");
const resetPasswordNew = document.querySelector("#reset-password-new");
const resetPasswordButton = document.querySelector("#reset-password-button");
const resetPasswordStatus = document.querySelector("#reset-password-status");

function showResetPasswordPage() {
  hideAllPages();
  resetPasswordPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
}

resetPasswordNavButton.addEventListener("click", () => navigateTo("/admin/reset-password"));

resetPasswordButton.addEventListener("click", async () => {
  const username = resetPasswordUsername.value.trim();
  const newPassword = resetPasswordNew.value.trim();
  if (!username || !newPassword) {
    setStatus(resetPasswordStatus, "Username and new password are required.", true);
    return;
  }
  resetPasswordButton.disabled = true;
  setStatus(resetPasswordStatus, "Resetting password...");
  const { ok, result } = await apiCall("POST", "/api/admin/reset-password", { username, newPassword });
  resetPasswordButton.disabled = false;
  if (!ok) {
    setStatus(resetPasswordStatus, result.error || "Could not reset password.", true);
    return;
  }
  setStatus(resetPasswordStatus, "Password reset successfully!");
  resetPasswordUsername.value = "";
  resetPasswordNew.value = "";
});

const changeUsernameNavButton = document.querySelector("#change-username-nav-button");
const changeUsernamePage = document.querySelector("#change-username-page");
const changeUsernameCurrent = document.querySelector("#change-username-current");
const changeUsernameNew = document.querySelector("#change-username-new");
const changeUsernameButton = document.querySelector("#change-username-button");
const changeUsernameStatus = document.querySelector("#change-username-status");

function showChangeUsernamePage() {
  hideAllPages();
  changeUsernamePage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
}

changeUsernameNavButton.addEventListener("click", () => navigateTo("/admin/change-username"));

changeUsernameButton.addEventListener("click", async () => {
  const currentUsername = changeUsernameCurrent.value.trim();
  const newUsername = changeUsernameNew.value.trim();
  if (!currentUsername || !newUsername) {
    setStatus(changeUsernameStatus, "Current and new usernames are required.", true);
    return;
  }
  changeUsernameButton.disabled = true;
  setStatus(changeUsernameStatus, "Changing username...");
  const { ok, result } = await apiCall("POST", "/api/admin/change-username", { currentUsername, newUsername });
  changeUsernameButton.disabled = false;
  if (!ok) {
    setStatus(changeUsernameStatus, result.error || "Could not change username.", true);
    return;
  }
  setStatus(changeUsernameStatus, "Username changed successfully!");
  changeUsernameCurrent.value = "";
  changeUsernameNew.value = "";
});

const auditLogNavButton = document.querySelector("#audit-log-nav-button");
const auditLogPage = document.querySelector("#audit-log-page");
const auditLogList = document.querySelector("#audit-log-list");

function showAuditLogPage() {
  hideAllPages();
  auditLogPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadAuditLog();
}

auditLogNavButton.addEventListener("click", () => navigateTo("/admin/audit-log"));

async function loadAuditLog() {
  const { ok, result } = await apiCall("GET", "/api/admin/audit-log");
  if (!ok) {
    auditLogList.innerHTML = `<li>${result.error || "Could not load audit log."}</li>`;
    return;
  }
  auditLogList.innerHTML = "";
  if (!result.logs || result.logs.length === 0) {
    auditLogList.innerHTML = "<li>No admin actions recorded yet.</li>";
    return;
  }
  for (const log of result.logs) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${log.action}</strong> by ${log.admin_username}<br/>${log.details}<br/><small>${new Date(log.created_at).toLocaleString()}</small>`;
    auditLogList.appendChild(li);
  }
}

const massMessageNavButton = document.querySelector("#mass-message-nav-button");
const massMessagePage = document.querySelector("#mass-message-page");
const massMessageSubject = document.querySelector("#mass-message-subject");
const massMessageBody = document.querySelector("#mass-message-body");
const massMessageButton = document.querySelector("#mass-message-button");
const massMessageStatus = document.querySelector("#mass-message-status");

function showMassMessagePage() {
  hideAllPages();
  massMessagePage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
}

massMessageNavButton.addEventListener("click", () => navigateTo("/admin/mass-message"));

massMessageButton.addEventListener("click", async () => {
  const subject = massMessageSubject.value.trim();
  const body = massMessageBody.value.trim();
  if (!subject || !body) {
    setStatus(massMessageStatus, "Subject and message are required.", true);
    return;
  }
  massMessageButton.disabled = true;
  setStatus(massMessageStatus, "Sending mass message...");
  const { ok, result } = await apiCall("POST", "/api/admin/mass-message", { subject, body });
  massMessageButton.disabled = false;
  if (!ok) {
    setStatus(massMessageStatus, result.error || "Could not send mass message.", true);
    return;
  }
  setStatus(massMessageStatus, `Mass message sent to ${result.sentCount || 0} users!`);
  massMessageSubject.value = "";
  massMessageBody.value = "";
});

const maintenanceNavButton = document.querySelector("#maintenance-nav-button");
const maintenancePage = document.querySelector("#maintenance-page");
const maintenanceStatusText = document.querySelector("#maintenance-status-text");
const maintenanceToggleButton = document.querySelector("#maintenance-toggle-button");
const maintenanceStatus = document.querySelector("#maintenance-status");

function showMaintenancePage() {
  hideAllPages();
  maintenancePage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadMaintenanceStatus();
}

maintenanceNavButton.addEventListener("click", () => navigateTo("/admin/maintenance"));

async function loadMaintenanceStatus() {
  const { ok, result } = await apiCall("GET", "/api/admin/maintenance-status");
  if (!ok) {
    maintenanceStatusText.textContent = result.error || "Could not load status.";
    return;
  }
  maintenanceStatusText.textContent = result.maintenanceMode ? "Maintenance mode is ON" : "Maintenance mode is OFF";
}

maintenanceToggleButton.addEventListener("click", async () => {
  maintenanceToggleButton.disabled = true;
  setStatus(maintenanceStatus, "Toggling maintenance mode...");
  const { ok, result } = await apiCall("POST", "/api/admin/toggle-maintenance");
  maintenanceToggleButton.disabled = false;
  if (!ok) {
    setStatus(maintenanceStatus, result.error || "Could not toggle maintenance mode.", true);
    return;
  }
  setStatus(maintenanceStatus, result.maintenanceMode ? "Maintenance mode enabled!" : "Maintenance mode disabled!");
  void loadMaintenanceStatus();
});

const userRolesNavButton = document.querySelector("#user-roles-nav-button");
const userRolesPage = document.querySelector("#user-roles-page");
const userRolesUsername = document.querySelector("#user-roles-username");
const promoteAdminButton = document.querySelector("#promote-admin-button");
const demoteAdminButton = document.querySelector("#demote-admin-button");
const userRolesStatus = document.querySelector("#user-roles-status");
const adminList = document.querySelector("#admin-list");

function showUserRolesPage() {
  hideAllPages();
  userRolesPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadAdminList();
}

userRolesNavButton.addEventListener("click", () => navigateTo("/admin/user-roles"));

promoteAdminButton.addEventListener("click", async () => {
  const username = userRolesUsername.value.trim();
  if (!username) {
    setStatus(userRolesStatus, "Username is required.", true);
    return;
  }
  promoteAdminButton.disabled = true;
  setStatus(userRolesStatus, "Promoting user...");
  const { ok, result } = await apiCall("POST", "/api/admin/promote", { username });
  promoteAdminButton.disabled = false;
  if (!ok) {
    setStatus(userRolesStatus, result.error || "Could not promote user.", true);
    return;
  }
  setStatus(userRolesStatus, "User promoted to admin!");
  userRolesUsername.value = "";
  void loadAdminList();
});

demoteAdminButton.addEventListener("click", async () => {
  const username = userRolesUsername.value.trim();
  if (!username) {
    setStatus(userRolesStatus, "Username is required.", true);
    return;
  }
  demoteAdminButton.disabled = true;
  setStatus(userRolesStatus, "Demoting user...");
  const { ok, result } = await apiCall("POST", "/api/admin/demote", { username });
  demoteAdminButton.disabled = false;
  if (!ok) {
    setStatus(userRolesStatus, result.error || "Could not demote user.", true);
    return;
  }
  setStatus(userRolesStatus, "User demoted from admin!");
  userRolesUsername.value = "";
  void loadAdminList();
});

async function loadAdminList() {
  const { ok, result } = await apiCall("GET", "/api/admin/list");
  if (!ok) {
    adminList.innerHTML = `<li>${result.error || "Could not load admin list."}</li>`;
    return;
  }
  adminList.innerHTML = "";
  if (!result.admins || result.admins.length === 0) {
    adminList.innerHTML = "<li>No admins found.</li>";
    return;
  }
  for (const admin of result.admins) {
    const li = document.createElement("li");
    li.textContent = admin.username;
    adminList.appendChild(li);
  }
}

const reportsNavButton = document.querySelector("#reports-nav-button");
const reportsPage = document.querySelector("#reports-page");
const reportsList = document.querySelector("#reports-list");

function showReportsPage() {
  hideAllPages();
  reportsPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadReports();
}

reportsNavButton.addEventListener("click", () => navigateTo("/admin/reports"));

async function loadReports() {
  const { ok, result } = await apiCall("GET", "/api/admin/reports");
  if (!ok) {
    reportsList.innerHTML = `<li>${result.error || "Could not load reports."}</li>`;
    return;
  }
  reportsList.innerHTML = "";
  if (!result.reports || result.reports.length === 0) {
    reportsList.innerHTML = "<li>No reports submitted yet.</li>";
    return;
  }
  for (const report of result.reports) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${report.subject}</strong><br/>${report.message}<br/><small>By ${report.username} at ${new Date(report.created_at).toLocaleString()}</small>`;
    reportsList.appendChild(li);
  }
}

const supportPage = document.querySelector("#support-page");
const reportSubject = document.querySelector("#report-subject");
const reportMessage = document.querySelector("#report-message");
const reportButton = document.querySelector("#report-button");
const reportStatus = document.querySelector("#report-status");

function showSupportPage() {
  hideAllPages();
  supportPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
}

reportButton.addEventListener("click", async () => {
  const subject = reportSubject.value.trim();
  const message = reportMessage.value.trim();
  if (!subject || !message) {
    setStatus(reportStatus, "Subject and message are required.", true);
    return;
  }
  reportButton.disabled = true;
  setStatus(reportStatus, "Submitting report...");
  const { ok, result } = await apiCall("POST", "/api/reports", { subject, message });
  reportButton.disabled = false;
  if (!ok) {
    setStatus(reportStatus, result.error || "Could not submit report.", true);
    return;
  }
  setStatus(reportStatus, "Report submitted successfully!");
  reportSubject.value = "";
  reportMessage.value = "";
});

const profilePage = document.querySelector("#profile-page");
const profileNavButton = document.querySelector("#profile-nav-button");
const profileTabs = Array.from(document.querySelectorAll(".profile-nav-tab"));
const profilePanes = {
  about: document.querySelector('[data-profile-pane="about"]'),
  creations: document.querySelector('[data-profile-pane="creations"]')
};

function showProfilePage(userId) {
  hideAllPages();
  closeProfileMoreMenu();
  closeProfileStatusEditor();
  profilePage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadProfile(userId || (currentUser ? currentUser.id : null));
}

profileNavButton.addEventListener("click", () => navigateTo("/profile"));

const profileMoreButton = document.querySelector("#profile-more-btn");
const profileMoreMenu = document.querySelector("#profile-more-menu");
const profileMoreItems = Array.from(document.querySelectorAll(".profile-more-item"));

function closeProfileMoreMenu() {
  profileMoreMenu.hidden = true;
  profileMoreButton.setAttribute("aria-expanded", "false");
}

function setProfileMoreMenu(ownProfile) {
  profileIsOwn = ownProfile;
  profileMoreItems.forEach((item) => {
    const action = item.dataset.profileMore;
    item.hidden = ownProfile
      ? action === "follow" || action === "trade-items"
      : action === "update-status";
  });
  closeProfileMoreMenu();
}

profileMoreButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const opening = profileMoreMenu.hidden;
  profileMoreMenu.hidden = !opening;
  profileMoreButton.setAttribute("aria-expanded", String(opening));
});

profileMoreMenu.addEventListener("click", (event) => {
  const item = event.target.closest(".profile-more-item");
  closeProfileMoreMenu();
  if (item && item.dataset.profileMore === "update-status" && profileIsOwn) {
    openProfileStatusEditor();
  }
});

document.addEventListener("click", (event) => {
  if (!profileMoreMenu.hidden && !event.target.closest(".profile-more-wrap")) closeProfileMoreMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeProfileMoreMenu();
});

const profileTagline = document.querySelector("[data-profile-status]");
const profileStatusEdit = document.querySelector("#profile-status-edit");
const profileStatusInput = document.querySelector("#profile-status-input");
const profileStatusSave = document.querySelector("#profile-status-save");
const profileStatusCancel = document.querySelector("#profile-status-cancel");
const profileStatusError = document.querySelector("#profile-status-error");
let profileStatusValue = "";
let profileIsOwn = false;

function openProfileStatusEditor() {
  profileStatusInput.value = profileStatusValue;
  profileStatusError.hidden = true;
  profileTagline.hidden = true;
  profileStatusEdit.hidden = false;
  profileStatusInput.focus();
  profileStatusInput.select();
}

function closeProfileStatusEditor() {
  profileStatusEdit.hidden = true;
  profileTagline.hidden = false;
}

async function saveProfileStatus() {
  profileStatusSave.disabled = true;
  const { ok, result } = await apiCall("PUT", "/api/me", { status: profileStatusInput.value.trim() });
  profileStatusSave.disabled = false;
  if (!ok) {
    profileStatusError.textContent = result.error || "Could not update your status.";
    profileStatusError.hidden = false;
    return;
  }
  profileStatusValue = profileStatusInput.value.trim();
  profileTagline.textContent = profileStatusValue ? `"${profileStatusValue}"` : '"Welcome to my profile!"';
  if (currentUser) currentUser.status = profileStatusValue;
  closeProfileStatusEditor();
}

profileStatusSave.addEventListener("click", () => void saveProfileStatus());
profileStatusCancel.addEventListener("click", closeProfileStatusEditor);
profileStatusInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") void saveProfileStatus();
  if (event.key === "Escape") closeProfileStatusEditor();
});

profileTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    profileTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.profileTab;
    Object.entries(profilePanes).forEach(([key, pane]) => {
      if (pane) pane.hidden = key !== target;
    });
  });
});

async function loadProfile(userId) {
  if (!userId) return;
  const { ok, result } = await apiCall("GET", `/api/users/${userId}`);
  if (!ok) return;

  const { user, friends, followers, following, friendsList } = result;

  const displayNameEl = document.querySelector("[data-profile-display-name]");
  const handleEl = document.querySelector("[data-profile-handle]");
  const statusEl = document.querySelector("[data-profile-status]");
  const aboutTextEl = document.querySelector("[data-profile-about-text]");
  const friendsEl = document.querySelector("[data-profile-friends]");
  const friendsCountEl = document.querySelector("[data-profile-friends-count]");
  const followersEl = document.querySelector("[data-profile-followers]");
  const followingEl = document.querySelector("[data-profile-following]");
  const rapEl = document.querySelector("[data-profile-rap]");
  const friendsGridEl = document.querySelector("[data-profile-friends-grid]");

  if (displayNameEl) displayNameEl.textContent = user.displayName || user.username || "User";
  if (handleEl) handleEl.textContent = `@${user.username || "username"}`;
  if (statusEl) statusEl.textContent = user.status ? `"${user.status}"` : '"Welcome to my profile!"';
  profileStatusValue = user.status || "";
  if (aboutTextEl) aboutTextEl.textContent = user.blurb || "Welcome to my profile!";
  const verifiedBadge = document.querySelector(".profile-verified-badge");
  if (verifiedBadge) {
    verifiedBadge.style.display = (user.verified || user.isAdmin) ? "" : "none";
  }
  setProfileMoreMenu(Boolean(currentUser) && String(user.id) === String(currentUser.id));
  if (friendsEl) friendsEl.textContent = friends;
  if (friendsCountEl) friendsCountEl.textContent = friends;
  if (followersEl) followersEl.textContent = followers;
  if (followingEl) followingEl.textContent = following;
  if (rapEl) rapEl.textContent = "0";

  if (friendsGridEl) {
    friendsGridEl.innerHTML = "";
    if (friendsList && friendsList.length > 0) {
      friendsList.forEach((friend) => {
        const card = document.createElement("div");
        card.className = "friend-card";
        const avatarDiv = document.createElement("div");
        avatarDiv.className = "friend-avatar";
        const img = document.createElement("img");
        img.src = "noFilter.png";
        img.alt = friend.username;
        avatarDiv.appendChild(img);
        const nameSpan = document.createElement("span");
        nameSpan.className = "friend-name";
        nameSpan.textContent = friend.username;
        card.appendChild(avatarDiv);
        card.appendChild(nameSpan);
        friendsGridEl.appendChild(card);
      });
    }
  }

  profileTabs.forEach((t) => t.classList.remove("active"));
  profileTabs[0].classList.add("active");
  Object.entries(profilePanes).forEach(([key, pane]) => {
    if (pane) pane.hidden = key !== "about";
  });

  await initProfile3DViewer(userId);
}

const portraitRenderers = new Map();

function initProfilePortrait(containerEl, equipped) {
  if (!containerEl || typeof THREE === "undefined") return;

  const key = containerEl.id || "portrait";
  const prev = portraitRenderers.get(key);
  if (prev) {
    cancelAnimationFrame(prev.animationId);
    if (prev.renderer.domElement.parentNode) {
      prev.renderer.domElement.parentNode.removeChild(prev.renderer.domElement);
    }
    prev.renderer.dispose();
  }

  const width = containerEl.clientWidth;
  const height = containerEl.clientHeight;

  const pScene = new THREE.Scene();
  const pCamera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  containerEl.appendChild(renderer.domElement);

  pScene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(3, 6, 5);
  pScene.add(dirLight);

  const pCharacter = new THREE.Group();
  const pEquippedGroup = new THREE.Group();
  pEquippedGroup.name = "equipped-items";
  pScene.add(pEquippedGroup);
  pScene.add(pCharacter);

  const GLTFLoader = THREE.GLTFLoader || window.GLTFLoader;
  if (!GLTFLoader) return;

  const loader = new GLTFLoader();
  loader.load("/r6.glb", (gltf) => {
    const model = gltf.scene;
    model.scale.set(1.5, 1.5, 1.5);
    model.position.y = -1;
    pCharacter.add(model);

    model.updateMatrixWorld(true);
    let headY = 1.25;
    const head = findAvatarHead(pCharacter);
    if (head) {
      headY = head.bounds.getCenter(new THREE.Vector3()).y;
    }

    pCamera.position.set(0, headY, 6.5);
    pCamera.lookAt(0, headY, 0);

    if (equipped && equipped.length > 0) {
      equipped.forEach((item) => {
        addEquippedModel(item, pScene, pCharacter);
      });
    }

    let animId;
    function animate() {
      animId = requestAnimationFrame(animate);
      renderer.render(pScene, pCamera);
    }
    animate();
    portraitRenderers.set(key, { renderer, animationId: animId });
  }, undefined, (error) => {
    console.error("Portrait GLB load failed:", error);
  });
}

function cleanupPortrait(key) {
  const prev = portraitRenderers.get(key);
  if (prev) {
    cancelAnimationFrame(prev.animationId);
    if (prev.renderer.domElement.parentNode) {
      prev.renderer.domElement.parentNode.removeChild(prev.renderer.domElement);
    }
    prev.renderer.dispose();
    portraitRenderers.delete(key);
  }
}

async function initWelcomePortrait() {
  const container = document.querySelector("#welcome-avatar-3d");
  if (!container || !currentUser) return;

  let equipped = [];
  try {
    const response = await fetch(`${apiBase}/api/users/${currentUser.id}/equipped`, { credentials: "same-origin" });
    if (response.ok) {
      const data = await response.json();
      const raw = data.equipped || [];
      raw.forEach((item) => {
        equipped.push({
          id: item.id,
          name: item.name,
          category: item.category,
          assetType: item.asset_type,
          modelFormat: item.model_format,
          modelUrl: item.model_url,
          thumbnailUrl: item.thumbnail_url,
          yOffset: item.y_offset || 0,
          xOffset: item.x_offset || 0,
          scaleOffset: item.scale_offset || 1,
          rotationOffset: item.rotation_offset || 0
        });
      });
    }
  } catch {
    // silently fail
  }

  initProfilePortrait(container, equipped);
}

async function initSmallAvatars() {
  if (!currentUser) return;

  let equipped = [];
  try {
    const response = await fetch(`${apiBase}/api/users/${currentUser.id}/equipped`, { credentials: "same-origin" });
    if (response.ok) {
      const data = await response.json();
      const raw = data.equipped || [];
      raw.forEach((item) => {
        equipped.push({
          id: item.id,
          name: item.name,
          category: item.category,
          assetType: item.asset_type,
          modelFormat: item.model_format,
          modelUrl: item.model_url,
          thumbnailUrl: item.thumbnail_url,
          yOffset: item.y_offset || 0,
          xOffset: item.x_offset || 0,
          scaleOffset: item.scale_offset || 1,
          rotationOffset: item.rotation_offset || 0
        });
      });
    }
  } catch {
    // silently fail
  }

  const headerContainer = document.querySelector("#header-avatar-3d");
  if (headerContainer) initProfilePortrait(headerContainer, equipped);

  const sidebarContainer = document.querySelector("#sidebar-avatar-3d");
  if (sidebarContainer) initProfilePortrait(sidebarContainer, equipped);
}

async function initPlayerAvatar(userId) {
  const container = document.querySelector(`#player-avatar-${userId}`);
  if (!container) return;

  let equipped = [];
  try {
    const response = await fetch(`${apiBase}/api/users/${userId}/equipped`, { credentials: "same-origin" });
    if (response.ok) {
      const data = await response.json();
      const raw = data.equipped || [];
      raw.forEach((item) => {
        equipped.push({
          id: item.id,
          name: item.name,
          category: item.category,
          assetType: item.asset_type,
          modelFormat: item.model_format,
          modelUrl: item.model_url,
          thumbnailUrl: item.thumbnail_url,
          yOffset: item.y_offset || 0,
          xOffset: item.x_offset || 0,
          scaleOffset: item.scale_offset || 1,
          rotationOffset: item.rotation_offset || 0
        });
      });
    }
  } catch {
    // silently fail
  }

  initProfilePortrait(container, equipped);
}

async function initProfile3DViewer(userId) {
  const container = document.querySelector("#profile-3d-container");
  if (!container) return;

  container.innerHTML = "";

  const savedAvatarScene = avatarScene;
  const savedAvatarCharacter = avatarCharacter;
  const savedAvatarRenderer = avatarRenderer;
  const savedAvatarCamera = avatarCamera;
  const savedAvatarControls = avatarControls;
  const savedAvatarAnimationId = avatarAnimationId;

  avatarScene = null;
  avatarCharacter = null;
  avatarRenderer = null;
  avatarCamera = null;
  avatarControls = null;
  avatarAnimationId = null;

  let equipped = [];

  if (userId) {
    try {
      const response = await fetch(`${apiBase}/api/users/${userId}/equipped`, { credentials: "same-origin" });
      if (response.ok) {
        const data = await response.json();
        equipped = data.equipped || [];

        const wearingGrid = document.querySelector("[data-profile-wearing-grid]");
        if (wearingGrid) {
          wearingGrid.innerHTML = "";
          equipped.forEach((item) => {
            const thumb = document.createElement("div");
            thumb.className = "wearing-thumb";
            if (item.thumbnail_url) {
              const img = document.createElement("img");
              img.src = item.thumbnail_url;
              img.alt = item.name;
              thumb.appendChild(img);
            } else {
              thumb.textContent = item.name || "Item";
            }
            wearingGrid.appendChild(thumb);
          });
        }

        equippedItems.clear();
        equipped.forEach((item) => {
          equippedItems.set(item.id, {
            id: item.id,
            name: item.name,
            assetType: item.asset_type,
            category: item.category,
            modelUrl: item.model_url,
            modelFormat: item.model_format,
            thumbnailUrl: item.thumbnail_url,
            yOffset: item.y_offset || 0,
            xOffset: item.x_offset || 0,
            scaleOffset: item.scale_offset || 1,
            rotationOffset: item.rotation_offset || 0
          });
        });
      }
    } catch (error) {
      console.error("Failed to load profile equipped items:", error);
    }
  }

  const portraitContainer = document.querySelector("#profile-avatar-3d");
  if (portraitContainer) {
    initProfilePortrait(portraitContainer, Array.from(equippedItems.values()));
  }

  initAvatar3D("/r6.glb", "#profile-3d-container", () => {
    const equippedGroup = avatarScene ? avatarScene.getObjectByName("equipped-items") : null;
    if (equippedGroup && equipped.length > 0) {
      for (const item of equippedItems.values()) {
        addEquippedModel(item);
      }
    }

    // Don't restore globals - keep profile viewer active
    // The avatar page will reinitialize its own viewer when needed
  });
}

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

async function loadPendingAssets() {
  if (!adminPendingList) return;
  adminPendingList.textContent = "";
  const { ok, result } = await apiCall("GET", "/api/admin/pending-assets");
  if (!ok) {
    const line = document.createElement("li");
    line.textContent = result.error || "Could not load pending assets.";
    adminPendingList.appendChild(line);
    return;
  }
  const assets = result.assets || [];
  if (!assets.length) {
    const line = document.createElement("li");
    line.className = "empty";
    line.textContent = "No pending assets. All assets are accepted.";
    adminPendingList.appendChild(line);
    return;
  }
  assets.forEach((asset) => {
    const line = document.createElement("li");
    line.className = "pending-asset-row";
    const info = document.createElement("div");
    info.className = "pending-asset-info";
    const name = document.createElement("strong");
    name.textContent = asset.name || "Unnamed Asset";
    const meta = document.createElement("span");
    meta.className = "pending-asset-meta";
    if (asset.source === "creation") {
      meta.textContent = `Upload • ${asset.category}`;
    } else {
      meta.textContent = `${asset.category} • ${asset.price} Robux`;
    }
    info.append(name, meta);
    const actions = document.createElement("div");
    actions.className = "pending-asset-actions";
    const acceptBtn = document.createElement("button");
    acceptBtn.className = "button-primary button-accent";
    acceptBtn.textContent = "Accept";
    acceptBtn.addEventListener("click", () => void acceptAsset(asset.id, asset.source, line));
    const rejectBtn = document.createElement("button");
    rejectBtn.className = "button-ghost";
    rejectBtn.textContent = "Reject";
    rejectBtn.addEventListener("click", () => void rejectAsset(asset.id, asset.source, line));
    actions.append(acceptBtn, rejectBtn);
    line.append(info, actions);
    adminPendingList.appendChild(line);
  });
}

async function acceptAsset(id, source, row) {
  const { ok, result } = await apiCall("POST", "/api/admin/accept-asset", { id, source });
  if (ok) {
    row.remove();
    if (!adminPendingList.children.length) {
      const line = document.createElement("li");
      line.className = "empty";
      line.textContent = "No pending assets. All assets are accepted.";
      adminPendingList.appendChild(line);
    }
  } else {
    setAdminAcceptStatus(result.error || "Could not accept the asset.", true);
  }
}

async function rejectAsset(id, source, row) {
  const { ok, result } = await apiCall("POST", "/api/admin/reject-asset", { id, source });
  if (ok) {
    row.remove();
    if (!adminPendingList.children.length) {
      const line = document.createElement("li");
      line.className = "empty";
      line.textContent = "No pending assets. All assets are accepted.";
      adminPendingList.appendChild(line);
    }
  } else {
    setAdminAcceptStatus(result.error || "Could not reject the asset.", true);
  }
}

function setAdminAcceptStatus(text, isError) {
  if (!adminAcceptStatus) return;
  adminAcceptStatus.textContent = text;
  adminAcceptStatus.className = `settings-status${isError ? " error" : ""}`;
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

// Ask the server to pull the item's Roblox assets and assemble a .glb from them.
async function buildRobloxModel(itemId) {
  const { ok, result } = await apiCall("POST", `/api/admin/catalog-items/${itemId}/build-model`, {});
  if (ok && result.built) {
    const skin = result.textureAssetId
      ? ", skinned"
      : result.solidColor ? `, flat colour rgb(${result.solidColor.join(",")})` : ", no colour from Roblox";
    return ` with a 3D model built from Roblox (${result.triangles} triangles${skin})`;
  }
  if (ok && result.reason) {
    return " with its 3D model";
  }
  return `, but its 3D model could not be built: ${result.error || "the build failed"}`;
}

adminUpdateButton.addEventListener("click", async () => {
  adminUpdateButton.disabled = true;
  setStatus(adminUpdateStatus, "Creating catalog item...");
  const payload = {
    code: adminUpdateCode.value.trim(),
    price: adminUpdatePrice.value.trim(),
    rap: adminUpdateRap.value.trim(),
    stock: adminUpdateStock.value.trim(),
    category: adminUpdateCategory.value,
    assetType: adminUpdateAssetType.value
  };
  const { ok, result } = await apiCall("POST", "/api/admin/update-asset", payload);
  if (!ok) {
    adminUpdateButton.disabled = false;
    setStatus(adminUpdateStatus, result.error || "Could not update the asset.", true);
    return;
  }
  const modelFile = adminUpdateModel.files[0];
  let modelNotice = "";
  if (modelFile) {
    const modelExtension = modelFile.name.split(".").pop().toLowerCase();
    if (modelExtension !== "glb" && modelExtension !== "rbxm" && modelExtension !== "rbxmx") {
      adminUpdateButton.disabled = false;
      setStatus(adminUpdateStatus, "Choose a .glb, .rbxm, or .rbxmx file.", true);
      return;
    }
    const modelResponse = await fetch(`/api/admin/catalog-items/${result.item.id}/model`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/octet-stream", "X-Model-Format": modelExtension },
      body: modelFile
    });
    const modelResult = await modelResponse.json().catch(() => ({}));
    if (!modelResponse.ok) {
      adminUpdateButton.disabled = false;
      setStatus(adminUpdateStatus, `Item created, but the model was not attached: ${modelResult.error || "Upload failed."}`, true);
      return;
    }
    if (modelResult.requiresConversion) {
      const references = (modelResult.assetReferences || []).join(", ") || "none found";
      const retrieval = modelResult.retrieval || {};
      if (retrieval.status === "missing_api_key") {
        modelNotice = `; RBXM saved; found asset references ${references}; configure ROBLOX_API_KEY on the server to test access`;
      } else if (retrieval.status === "all_assets_retrieved") {
        modelNotice = `; RBXM saved; retrieved ${retrieval.assets.length} referenced asset files; GLB conversion is still pending`;
      } else if (retrieval.status === "some_assets_failed") {
        const failedIds = retrieval.assets.filter((asset) => !asset.ok).map((asset) => asset.assetId).join(", ");
        modelNotice = `; RBXM saved; could not retrieve asset references ${failedIds}`;
      } else if (retrieval.status === "mesh_unavailable") {
        const denied = (retrieval.assets || []).find((asset) => asset.assetId === retrieval.meshAssetId);
        modelNotice = `; RBXM saved; Roblox refused to send the 3D shape (asset ${retrieval.meshAssetId || "not found"}${denied?.error ? `: ${denied.error}` : ""})`;
      } else if (retrieval.status === "no_references_found") {
        modelNotice = "; RBXM saved but it references no Roblox assets, so there is nothing to convert";
      } else {
        modelNotice = `; RBXM saved; asset references: ${references}; ${retrieval.message || "GLB conversion is still pending"}`;
      }
    } else {
      modelNotice = " with its 3D model";
    }
    if (modelResult.detectedFromContent) {
      modelNotice = `; file contents are .${modelResult.modelFormat} despite the .${modelExtension} extension${modelNotice}`;
    }
    if (modelResult.retrieval?.status === "all_assets_retrieved" || modelResult.retrieval?.status === "some_assets_failed") {
      setStatus(adminUpdateStatus, "Converting the RBXM into a 3D model...");
      modelNotice = await buildRobloxModel(result.item.id);
    }
  } else {
    setStatus(adminUpdateStatus, "Building the 3D model from Roblox...");
    modelNotice = await buildRobloxModel(result.item.id);
  }
  adminUpdateButton.disabled = false;
  setStatus(adminUpdateStatus, `"${result.item.name}" is now live in the catalog${modelNotice}.`);
  adminImportResult.hidden = true;
  adminUpdateCode.value = "";
  adminUpdatePrice.value = "";
  adminUpdateRap.value = "";
  adminUpdateStock.value = "";
  adminUpdateCategory.value = "";
  adminUpdateAssetType.value = "";
  adminUpdateModel.value = "";
  void loadAdminCodes();
  navigateTo(`/item/${result.item.id}`);
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

adminRobuxButton.addEventListener("click", async () => {
  const username = adminRobuxUsername.value.trim();
  const amount = Number(adminRobuxAmount.value);
  if (!username) {
    setStatus(adminRobuxStatus, "Enter a username.", true);
    return;
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    setStatus(adminRobuxStatus, "Enter a valid amount.", true);
    return;
  }
  adminRobuxButton.disabled = true;
  setStatus(adminRobuxStatus, "Giving Robux...");
  const { ok, result } = await apiCall("POST", "/api/admin/give-robux", { username, amount });
  adminRobuxButton.disabled = false;
  if (!ok) {
    setStatus(adminRobuxStatus, result.error || "Could not give Robux.", true);
    return;
  }
  setStatus(adminRobuxStatus, `Gave ${amount} Robux to ${result.username}. Balance: ${result.newRobux}.`);
  adminRobuxUsername.value = "";
  adminRobuxAmount.value = "";
  void loadRobuxHistory();
  void refreshCurrentUser();
});

async function loadRobuxHistory() {
  const { ok, result } = await apiCall("GET", "/api/admin/robux-history");
  adminRobuxHistoryList.textContent = "";
  if (!ok) {
    const line = document.createElement("li");
    line.textContent = result.error || "Could not load history.";
    adminRobuxHistoryList.appendChild(line);
    return;
  }
  const transactions = result.transactions || [];
  if (!transactions.length) {
    const line = document.createElement("li");
    line.className = "empty";
    line.textContent = "No Robux transactions yet.";
    adminRobuxHistoryList.appendChild(line);
    return;
  }
  transactions.forEach((tx) => {
    const line = document.createElement("li");
    const when = new Date(tx.created_at).toLocaleString();
    line.innerHTML = `<strong>${tx.admin_username}</strong> gave <strong>${tx.amount}</strong> Robux to <strong>${tx.target_username}</strong> (${tx.previous_balance} → ${tx.new_balance}) <span class="code-state">${when}</span>`;
    adminRobuxHistoryList.appendChild(line);
  });
}

itemBackButton.addEventListener("click", () => navigateTo("/catalog"));

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
  hideAllPages();
  createPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  void loadMyCreations();
}

topCreateButton.addEventListener("click", () => navigateTo("/create"));

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

  hideAllPages();
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

configureCancelButton.addEventListener("click", () => navigateTo("/create"));

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

configureAccessCancel.addEventListener("click", () => navigateTo("/create"));

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
  hideAllPages();
  itemPage.hidden = false;
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

const discordLinkOverlay = document.querySelector("#discord-link-overlay");
const discordLinkClose = document.querySelector("#discord-link-close");
const discordLinkCode = document.querySelector("#discord-link-code");
const discordLinkVerify = document.querySelector("#discord-link-verify");
const discordLinkStatus = document.querySelector("#discord-link-status");

function openDiscordLinkModal() {
  discordLinkCode.value = "";
  discordLinkStatus.textContent = "";
  discordLinkStatus.className = "discord-link-status";
  discordLinkOverlay.hidden = false;
  discordLinkCode.focus();
}

function closeDiscordLinkModal() {
  discordLinkOverlay.hidden = true;
}

discordConnectButton.addEventListener("click", () => {
  openDiscordLinkModal();
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

discordLinkClose.addEventListener("click", closeDiscordLinkModal);

discordLinkOverlay.addEventListener("click", (event) => {
  if (event.target === discordLinkOverlay) {
    closeDiscordLinkModal();
  }
});

discordLinkVerify.addEventListener("click", async () => {
  const code = discordLinkCode.value.trim();
  if (!code) {
    discordLinkStatus.textContent = "Enter the 6-digit code from Discord.";
    discordLinkStatus.className = "discord-link-status error";
    return;
  }
  discordLinkVerify.disabled = true;
  discordLinkStatus.textContent = "Verifying...";
  discordLinkStatus.className = "discord-link-status";
  const { ok, result } = await apiCall("POST", "/api/discord/verify-link", { code });
  discordLinkVerify.disabled = false;
  if (!ok) {
    discordLinkStatus.textContent = result.error || "Could not verify code.";
    discordLinkStatus.className = "discord-link-status error";
    return;
  }
  discordLinkStatus.textContent = `Discord account linked: ${result.discordUsername}`;
  discordLinkStatus.className = "discord-link-status success";
  const user = await fetchMe();
  if (user) {
    currentUser = user;
    populateSettings(user);
  }
  setTimeout(closeDiscordLinkModal, 1500);
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
  history.replaceState({}, "", "/settings");
  void showSettingsPage().then(() => {
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

/* Avatar Editor */
const avatarNavButton = document.querySelector("#avatar-nav-button");
const avatarPage = document.querySelector("#avatar-page");
const avatarTabs = Array.from(document.querySelectorAll(".avatar-tab"));
const avatarSubtabsContainer = document.querySelector("#avatar-subtabs");
const avatarItemsGrid = document.querySelector("#avatar-items-grid");
const avatarOutfitsPane = document.querySelector("#avatar-outfits-pane");
const avatarRigBtns = Array.from(document.querySelectorAll(".avatar-rig-btn"));
const avatarViewToggle = document.querySelector(".avatar-view-toggle");
const scalingSliders = Array.from(document.querySelectorAll(".scaling-slider"));

const AVATAR_SUBTABS = {
  recent: [],
  clothing: [
    { group: "Accessories", items: ["Hat", "Hair", "Face", "Neck", "Shoulders", "Front", "Back", "Waist"] },
    { group: "Clothes", items: ["Shirts", "Pants", "T-Shirts"] },
    { group: "Gear", items: ["Gear"] }
  ],
  body: [
    { group: "", items: ["Skin Tone", "Packages", "Face", "Head", "Torso", "Left Arms", "Right Arms", "Left Legs", "Right Legs"] }
  ],
  animations: [
    { group: "", items: ["Walk", "Run", "Fall", "Jump", "Swim", "Climb", "Idle", "Emotes"] }
  ],
  outfits: []
};

function renderAvatarSubtabs(tabName) {
  avatarSubtabsContainer.innerHTML = "";
  const groups = AVATAR_SUBTABS[tabName] || [];
  if (groups.length === 0) {
    avatarSubtabsContainer.hidden = true;
    return;
  }
  avatarSubtabsContainer.hidden = false;
  let first = true;
  for (const group of groups) {
    if (group.group) {
      const label = document.createElement("span");
      label.className = "avatar-subtab-group";
      label.textContent = group.group;
      avatarSubtabsContainer.appendChild(label);
    }
    for (const item of group.items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "avatar-subtab" + (first ? " active" : "");
      btn.textContent = item;
      btn.addEventListener("click", () => {
        avatarSubtabsContainer.querySelectorAll(".avatar-subtab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
      avatarSubtabsContainer.appendChild(btn);
      first = false;
    }
  }
}

avatarTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    avatarTabs.forEach((t) => t.classList.toggle("active", t === tab));
    const tabName = tab.dataset.tab;
    if (tabName === "outfits") {
      avatarItemsGrid.hidden = true;
      avatarSubtabsContainer.hidden = true;
      avatarOutfitsPane.hidden = false;
    } else {
      avatarItemsGrid.hidden = false;
      avatarOutfitsPane.hidden = true;
      renderAvatarSubtabs(tabName);
    }
  });
});

avatarRigBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    avatarRigBtns.forEach((b) => b.classList.toggle("active", b === btn));
  });
});

avatarViewToggle.addEventListener("click", () => {
  const is3d = avatarViewToggle.dataset.view === "3d";
  avatarViewToggle.dataset.view = is3d ? "2d" : "3d";
  avatarViewToggle.textContent = is3d ? "2D" : "3D";
});

scalingSliders.forEach((slider) => {
  const valueSpan = slider.nextElementSibling;
  slider.addEventListener("input", () => {
    valueSpan.textContent = slider.value + "%";
  });
});

let avatarScene, avatarCamera, avatarRenderer, avatarCharacter, avatarAnimationId, avatarControls;
const equippedItems = new Map();

function isAvatarFace(item) {
  const assetType = item.assetType ?? item.asset_type;
  const category = String(item.category || "").toLowerCase();
  return Number(assetType) === 18 ||
    category === "faces" ||
    category === "featured_faces";
}

async function detectRenderFileFormat(file) {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (
    header.length >= 12 &&
    header[0] === 0x67 && header[1] === 0x6c && header[2] === 0x54 && header[3] === 0x46 &&
    new DataView(header.buffer).getUint32(4, true) === 2 &&
    new DataView(header.buffer).getUint32(8, true) === file.size
  ) {
    return "glb";
  }
  if (header.length >= 8 && String.fromCharCode(...header.subarray(0, 8)) === "<roblox!") {
    return "rbxm";
  }
  return null;
}

function findAvatarHead(characterRef) {
  const character = characterRef || avatarCharacter;
  if (!character) return null;
  let headMesh = null;
  let headBounds = null;
  let highestHeadCenter = -Infinity;
  character.updateMatrixWorld(true);
  character.traverse((candidate) => {
    if (!candidate.isMesh) return;
    const bounds = new THREE.Box3().setFromObject(candidate);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    if (size.x < 0.75 || size.y < 0.75 || center.y <= highestHeadCenter) return;
    headMesh = candidate;
    headBounds = bounds;
    highestHeadCenter = center.y;
  });
  return headMesh ? { mesh: headMesh, bounds: headBounds, size: headBounds.getSize(new THREE.Vector3()) } : null;
}

function disposeEquippedObject(object) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of childMaterials) {
      if (!material) continue;
      materials.add(material);
      if (material.map) textures.add(material.map);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
}

function initAvatar3D(modelUrl = null, containerSelector = ".avatar-preview-box", onComplete = null) {
  const container = document.querySelector(containerSelector);
  if (!container || typeof THREE === "undefined") return;

  const placeholder = container.querySelector(".avatar-preview-placeholder");
  if (placeholder) {
    placeholder.style.display = "none";
  }

  if (avatarRenderer) {
    container.removeChild(avatarRenderer.domElement);
    avatarRenderer.dispose();
    cancelAnimationFrame(avatarAnimationId);
    if (avatarControls) {
      avatarControls.dispose();
      avatarControls = null;
    }
  }

  const width = container.clientWidth;
  const height = container.clientHeight;

  avatarScene = new THREE.Scene();
  avatarCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  avatarCamera.position.set(0, 0, 10);

  avatarRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  avatarRenderer.setSize(width, height);
  avatarRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(avatarRenderer.domElement);

  const OrbitControls = THREE.OrbitControls || window.OrbitControls;
  if (OrbitControls) {
    avatarControls = new OrbitControls(avatarCamera, avatarRenderer.domElement);
    avatarControls.enableDamping = true;
    avatarControls.dampingFactor = 0.08;
    avatarControls.autoRotate = true;
    avatarControls.autoRotateSpeed = 1.5;
    avatarControls.minDistance = 4;
    avatarControls.maxDistance = 20;
    avatarControls.target.set(0, 0.5, 0);
    avatarControls.update();
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  avatarScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  avatarScene.add(directionalLight);

  avatarCharacter = new THREE.Group();
  const equippedGroup = new THREE.Group();
  equippedGroup.name = "equipped-items";
  avatarScene.add(equippedGroup);

  const GLTFLoader = THREE.GLTFLoader || window.GLTFLoader;

  if (modelUrl && GLTFLoader) {
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1.5, 1.5, 1.5);
        model.position.y = -1;
        avatarCharacter.add(model);
        const equippedGroup = avatarScene.getObjectByName("equipped-items");
        if (equippedGroup) {
          const childrenToRemove = [];
          equippedGroup.children.forEach((child) => {
            childrenToRemove.push(child);
          });
          childrenToRemove.forEach((child) => {
            equippedGroup.remove(child);
            disposeEquippedObject(child);
          });
          for (const item of equippedItems.values()) {
            addEquippedModel(item);
          }
        }
        console.log("GLB loaded successfully:", modelUrl);
        if (onComplete) onComplete();
      },
      (progress) => {
        console.log("Loading GLB:", progress.loaded, progress.total);
      },
      (error) => {
        console.error("GLB load failed:", error);
        console.log("Falling back to procedural character");
        buildProceduralCharacter();
      }
    );
  } else {
    console.log("No GLB URL or GLTFLoader not available, using procedural character");
    buildProceduralCharacter();
  }

  avatarScene.add(avatarCharacter);

  function buildProceduralCharacter() {
    const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xf5c6a0 });
    const headGeometry = new THREE.BoxGeometry(1, 1, 1);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 1.5;
    avatarCharacter.add(head);

    const torsoGeometry = new THREE.BoxGeometry(1, 1.2, 0.6);
    const torso = new THREE.Mesh(torsoGeometry, skinMaterial);
    torso.position.y = 0.4;
    avatarCharacter.add(torso);

    const armGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
    leftArm.position.set(-0.7, 0.4, 0);
    avatarCharacter.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
    rightArm.position.set(0.7, 0.4, 0);
    avatarCharacter.add(rightArm);

    const legGeometry = new THREE.BoxGeometry(0.45, 1.2, 0.45);
    const leftLeg = new THREE.Mesh(legGeometry, skinMaterial);
    leftLeg.position.set(-0.25, -0.8, 0);
    avatarCharacter.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, skinMaterial);
    rightLeg.position.set(0.25, -0.8, 0);
    avatarCharacter.add(rightLeg);

    const equippedGroup = avatarScene.getObjectByName("equipped-items");
    if (equippedGroup) {
      const childrenToRemove = [];
      equippedGroup.children.forEach((child) => {
        childrenToRemove.push(child);
      });
      childrenToRemove.forEach((child) => {
        equippedGroup.remove(child);
        disposeEquippedObject(child);
      });
      for (const item of equippedItems.values()) {
        addEquippedModel(item);
      }
    }
  }

  function animate() {
    avatarAnimationId = requestAnimationFrame(animate);
    if (avatarControls) {
      avatarControls.update();
    }
    avatarRenderer.render(avatarScene, avatarCamera);
  }
  animate();

  window.addEventListener("resize", () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    avatarCamera.aspect = newWidth / newHeight;
    avatarCamera.updateProjectionMatrix();
    avatarRenderer.setSize(newWidth, newHeight);
    if (avatarControls) {
      avatarControls.update();
    }
  });
}

function showAvatarPage() {
  hideAllPages();
  avatarPage.hidden = false;
  homeScreen.scrollTo({ top: 0, behavior: "smooth" });
  renderAvatarSubtabs("recent");
  void loadOwnedItems();
  void loadEquippedItems();
  setTimeout(() => initAvatar3D("/r6.glb"), 100);
}

async function loadOwnedItems() {
  avatarItemsGrid.innerHTML = "";
  try {
    const response = await fetch(`${apiBase}/api/avatar/owned`, { credentials: "same-origin" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(result.items)) {
      return;
    }
    for (const item of result.items) {
      const card = document.createElement("div");
      card.className = "avatar-item-card";
      card.dataset.itemId = item.catalog_item_id;
      if (equippedItems.has(item.catalog_item_id)) {
        card.classList.add("selected");
      }
      const thumb = document.createElement("div");
      thumb.className = "avatar-item-thumb";
      if (item.thumbnail_url) {
        const img = document.createElement("img");
        img.src = item.thumbnail_url;
        img.alt = item.name || "";
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        thumb.appendChild(img);
      }
      const name = document.createElement("div");
      name.className = "avatar-item-name";
      name.textContent = item.name || "Unnamed";
      name.title = item.name || "";
      card.append(thumb, name);
      card.addEventListener("click", () => toggleEquipItem(item, card));
      avatarItemsGrid.appendChild(card);
    }
  } catch {
    // silently fail
  }
}

async function loadEquippedItems() {
  equippedItems.clear();
  const equippedGroup = avatarScene ? avatarScene.getObjectByName("equipped-items") : null;
  if (equippedGroup) {
    const childrenToRemove = [];
    equippedGroup.children.forEach((child) => {
      childrenToRemove.push(child);
    });
    childrenToRemove.forEach((child) => {
      equippedGroup.remove(child);
      disposeEquippedObject(child);
    });
  }
  try {
    const response = await fetch(`${apiBase}/api/avatar/equipped`, { credentials: "same-origin" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(result.items)) {
      return;
    }
    let hasEquippedFace = false;
    const duplicateFaceIds = [];
    for (const item of result.items) {
      const catalogItemId = item.catalog_item_id;
      const itemData = {
        id: catalogItemId,
        name: item.name,
        category: item.category,
        assetType: item.asset_type,
        modelFormat: item.model_format,
        thumbnailUrl: item.thumbnail_url,
        modelUrl: item.model_url,
        yOffset: item.y_offset || 0,
        xOffset: item.x_offset || 0,
        scaleOffset: item.scale_offset || 1,
        rotationOffset: item.rotation_offset || 0
      };
      if (isAvatarFace(itemData)) {
        if (hasEquippedFace) {
          duplicateFaceIds.push(catalogItemId);
          continue;
        }
        hasEquippedFace = true;
      }
      equippedItems.set(catalogItemId, itemData);
      const card = document.querySelector(`.avatar-item-card[data-item-id="${catalogItemId}"]`);
      if (card) {
        card.classList.add("selected");
      }
      addEquippedModel(itemData);
    }
    await Promise.all(duplicateFaceIds.map((catalogItemId) =>
      fetch(`${apiBase}/api/avatar/unequip`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogItemId })
      }).catch(() => {})
    ));
  } catch {
    // silently fail
  }
}

async function toggleEquipItem(item, card) {
  const catalogItemId = item.catalog_item_id || item.id;
  const isSelected = card.classList.contains("selected");
  const itemData = {
    id: catalogItemId,
    name: item.name,
    category: item.category,
    assetType: item.assetType ?? item.asset_type,
    modelFormat: item.modelFormat ?? item.model_format,
    thumbnailUrl: item.thumbnailUrl ?? item.thumbnail_url,
    modelUrl: item.modelUrl ?? item.model_url
  };
  console.log("Toggle equip:", { isSelected, itemData });
  if (isSelected) {
    card.classList.remove("selected");
    equippedItems.delete(catalogItemId);
    removeEquippedModel(catalogItemId);
    await fetch(`${apiBase}/api/avatar/unequip`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogItemId })
    }).catch(() => {});
  } else {
    card.classList.add("selected");
    const replacedFaceIds = [];
    if (isAvatarFace(itemData)) {
      for (const [equippedId, equippedItem] of equippedItems) {
        if (isAvatarFace(equippedItem) && String(equippedId) !== String(catalogItemId)) {
          equippedItems.delete(equippedId);
          removeEquippedModel(equippedId);
          document.querySelector(`.avatar-item-card[data-item-id="${equippedId}"]`)?.classList.remove("selected");
          replacedFaceIds.push(equippedId);
        }
      }
    }
    equippedItems.set(catalogItemId, itemData);
    addEquippedModel(itemData);
    await Promise.all(replacedFaceIds.map((replacedId) =>
      fetch(`${apiBase}/api/avatar/unequip`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogItemId: replacedId })
      }).catch(() => {})
    ));
    await fetch(`${apiBase}/api/avatar/equip`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogItemId })
    }).catch(() => {});
  }
}

function getItemColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [0xa94cae, 0x2ecc40, 0xe74c3c, 0x3498db, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22];
  return colors[Math.abs(hash) % colors.length];
}

function addEquippedModel(item, sceneRef, characterRef) {
  const character = characterRef || avatarCharacter;
  const scene = sceneRef || avatarScene;
  if (!character) return;
  const equippedGroup = scene.getObjectByName("equipped-items");
  if (!equippedGroup) return;

  let assetType = item.assetType;
  const category = (item.category || "").toLowerCase();
  const isFaceItem = isAvatarFace(item);
  const modelUrl = item.modelUrl || item.model_url;
  const modelFormat = item.modelFormat || item.model_format;
  const thumbnailUrl = item.thumbnailUrl;
  let mesh;

  console.log("Equipping item:", { id: item.id, name: item.name, assetType, category, modelUrl, modelFormat, thumbnailUrl });

  if (!modelUrl && modelFormat === "rbxm") {
    console.warn("rbxm model needs GLB conversion, rendering placeholder:", item.name);
  }

  if (modelUrl) {
    const GLTFLoader = THREE.GLTFLoader || window.GLTFLoader;
    if (!GLTFLoader) {
      console.error("GLTFLoader is unavailable for item model:", item.name);
      return;
    }
    mesh = new THREE.Group();
    mesh.name = `equip-${item.id}`;
    equippedGroup.add(mesh);
    const loader = new GLTFLoader();
    const cacheBustedUrl = modelUrl.includes("?") ? `${modelUrl}&t=${Date.now()}` : `${modelUrl}?t=${Date.now()}`;
    loader.load(
      cacheBustedUrl,
      (gltf) => {
        if (mesh.parent !== equippedGroup) {
          disposeEquippedObject(gltf.scene);
          return;
        }
        const model = gltf.scene;
        // Hats and hair accessories share the same placement: stud-accurate scale, rotated to face
        // forward, sitting on the head with a small forward offset.
        const isHat = Number(assetType) === 8 || Number(assetType) === 41 || Number(assetType) === 48 || Number(assetType) === 49;
        const avatarHead = isHat ? findAvatarHead(character) : null;
        if (avatarHead) {
          model.updateMatrixWorld(true);
          const sourceBounds = new THREE.Box3().setFromObject(model);
          const sourceSize = sourceBounds.getSize(new THREE.Vector3());
          if (sourceSize.x > 0) {
            // Roblox legacy meshes are measured in studs and a head is two studs wide, so a hat
            // already carries its real proportions; hair is authored loose and gets stretched to fit.
            const hatScale = Number(assetType) === 49
              ? avatarHead.size.x / 2 * 2.6
              : avatarHead.size.x / 2 * 0.85;
            model.scale.multiplyScalar(isHat
              ? hatScale
              : avatarHead.size.x * 1.08 / sourceSize.x);
            model.updateMatrixWorld(true);
            const modelBounds = new THREE.Box3().setFromObject(model);
            const modelCenter = modelBounds.getCenter(new THREE.Vector3());
            const headCenter = avatarHead.bounds.getCenter(new THREE.Vector3());
            model.position.x += headCenter.x - modelCenter.x;
            if (Number(assetType) === 48) {
              // Hat with ears — center on head vertically so all models sit at ear level regardless of shape.
              model.position.y += headCenter.y - modelCenter.y;
            } else if (Number(assetType) === 49) {
              // Fedora — sit higher on the head
              model.position.y += avatarHead.bounds.max.y - modelBounds.min.y + 0.1;
            } else {
              model.position.y += avatarHead.bounds.max.y - modelBounds.min.y - 0.35;
            }
            model.position.z += headCenter.z - modelCenter.z + 0.12;
            model.rotation.y = Math.PI;
          }
        }
        if (item.id === 31) {
          model.position.y -= 0.8;
        } else if (item.id === 33) {
          model.position.z -= 0.3;
        } else if (item.id === 28) {
          model.scale.multiplyScalar(0.92);
        }
        if (Number(item.yOffset ?? item.y_offset)) {
          model.position.y += Number(item.yOffset ?? item.y_offset);
        }
        if (Number(item.xOffset ?? item.x_offset)) {
          model.position.x += Number(item.xOffset ?? item.x_offset);
        }
        const savedScale = Number(item.scaleOffset ?? item.scale_offset);
        if (savedScale && savedScale !== 1) {
          model.scale.multiplyScalar(savedScale);
        }
        const savedRotation = Number(item.rotationOffset ?? item.rotation_offset);
        if (savedRotation) {
          model.rotation.y += savedRotation * Math.PI / 180;
        }
        mesh.add(model);
        console.log("3D item model loaded:", item.name, modelUrl);
      },
      undefined,
      (error) => {
        console.error("3D item model failed to load:", item.name, error);
        if (mesh.parent) equippedGroup.remove(mesh);
      }
    );
    return;
  }

  if (Number(assetType) === 41) {
    // Hair - render as textured box on top of head (like a hat)
    assetType = 8;
  }

  // Fallback: infer asset type from category if not set
  if (!assetType && assetType !== 0) {
    if (isFaceItem) {
      assetType = 18;
    } else if (category === "hats" || category === "accessories") {
      assetType = 8;
    } else if (category === "clothing") {
      assetType = 11;
    }
    console.log("Inferred assetType from category:", assetType);
  }

  // Create texture from item thumbnail if available
  let material;
  if (thumbnailUrl) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const texture = textureLoader.load(
      thumbnailUrl,
      (loadedTexture) => {
        console.log("Texture loaded for:", item.name);
        if (assetType === 18) {
          loadedTexture.repeat.set(0.72, 0.72);
          loadedTexture.offset.set(0.14, 0.14);
          loadedTexture.updateMatrix();
        }
        loadedTexture.needsUpdate = true;
        if (mesh && mesh.material) {
          mesh.material.map = loadedTexture;
          mesh.material.needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.warn("Failed to load texture for item:", item.name, error);
      }
    );
    material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
  } else {
    if (!thumbnailUrl) console.warn("No thumbnail URL for item:", item.name);
    material = new THREE.MeshLambertMaterial({ color: getItemColor(item.name) });
  }

  // Character is scaled 1.5x and positioned at y=-1
  // Head center is approximately at y=1.5 in local space = 1.5*1.5-1 = 1.25 in world space
  const scale = 1.5;
  const charY = -1;
  
  // Roblox AvatarAssetType IDs for precise placement (in world coordinates)
  if (assetType === 18) {
    const avatarHead = findAvatarHead(character);
    const headMesh = avatarHead?.mesh;
    const headBounds = avatarHead?.bounds;
    const headSize = avatarHead?.size;
    const faceWidth = headSize ? headSize.x * 0.72 : 0.8;
    const faceHeight = headSize ? headSize.y * 0.68 : 0.75;
    material.depthWrite = false;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -4;
    if (headBounds && headMesh) {
      const headCenter = headBounds.getCenter(new THREE.Vector3());
      const facePosition = new THREE.Vector3(headCenter.x, headCenter.y, headBounds.max.z + 0.002);
      if (THREE.DecalGeometry) {
        const faceSize = new THREE.Vector3(faceWidth, faceHeight, headSize.z * 0.3);
        const faceOrientation = new THREE.Euler();
        const faceGeometry = new THREE.DecalGeometry(headMesh, facePosition, faceOrientation, faceSize);
        mesh = new THREE.Mesh(faceGeometry, material);
      } else {
        mesh = new THREE.Mesh(new THREE.PlaneGeometry(faceWidth, faceHeight), material);
        mesh.position.copy(facePosition);
      }
    } else {
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(faceWidth, faceHeight), material);
      mesh.position.set(0, 1.5, 0.51);
    }
  } else if (assetType === 8) {
    // Hat - place on top of the detected head.
    const geo = new THREE.BoxGeometry(0.8 * scale, 0.4 * scale, 0.8 * scale);
    mesh = new THREE.Mesh(geo, material);
    const avatarHead = findAvatarHead(character);
    mesh.position.set(0, avatarHead ? avatarHead.bounds.max.y + 0.15 : 2.8, 0);
  } else if (assetType === 49) {
    // Fedora - slightly larger than regular hats.
    const geo = new THREE.BoxGeometry(1.3 * scale, 0.5 * scale, 1.3 * scale);
    mesh = new THREE.Mesh(geo, material);
    const avatarHead = findAvatarHead(character);
    mesh.position.set(0, avatarHead ? avatarHead.bounds.max.y + 0.15 : 2.8, 0);
  } else if (assetType === 48) {
    // Hat with ears - same placement as regular hats, then lowered.
    const geo = new THREE.BoxGeometry(1.0 * scale, 0.5 * scale, 0.8 * scale);
    mesh = new THREE.Mesh(geo, material);
    const avatarHead = findAvatarHead(character);
    mesh.position.set(0, (avatarHead ? avatarHead.bounds.max.y + 0.15 : 2.8) - 1.2, 0);
  } else if (assetType === 42) {
    // FaceAccessory - front of face (glasses, mask)
    const geo = new THREE.PlaneGeometry(0.7 * scale, 0.35 * scale);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, 1.25, 0.4 * scale);
  } else if (assetType === 43) {
    // NeckAccessory - neck area
    const geo = new THREE.PlaneGeometry(0.5 * scale, 0.3 * scale);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, 1.25 - 0.4 * scale, 0.25 * scale);
  } else if (assetType === 44) {
    // ShoulderAccessory - shoulders
    const geo = new THREE.PlaneGeometry(0.4 * scale, 0.4 * scale);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0.7 * scale, 1.25 - 0.3 * scale, 0);
  } else if (assetType === 45) {
    // FrontAccessory - front of torso
    const geo = new THREE.PlaneGeometry(0.9 * scale, 0.7 * scale);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, 0.2, 0.4 * scale);
  } else if (assetType === 46) {
    // BackAccessory - back
    const geo = new THREE.PlaneGeometry(0.9 * scale, 0.9 * scale);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, 0.3, -0.4 * scale);
    mesh.rotation.y = Math.PI;
  } else if (assetType === 47) {
    // WaistAccessory - waist
    const geo = new THREE.PlaneGeometry(1.0 * scale, 0.35 * scale);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, -0.2, 0.35 * scale);
  } else if (assetType === 11) {
    // Shirt - torso
    const geo = new THREE.BoxGeometry(1.1 * scale, 1.3 * scale, 0.7 * scale);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, 0.2, 0);
  } else if (assetType === 12) {
    // Pants - legs
    const geo = new THREE.BoxGeometry(1.0 * scale, 1.2 * scale, 0.6 * scale);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, -0.6, 0);
  } else if (category === "accessories" || category === "gear") {
    const geo = new THREE.SphereGeometry(0.35 * scale, 16, 16);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, item.id === 31 ? 0.85 : item.id === 33 ? 0.85 : 1.25 + 0.5 * scale, 0);
  } else if (category === "clothing") {
    const geo = new THREE.BoxGeometry(1.1 * scale, 1.3 * scale, 0.7 * scale);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, 0.2, 0);
  } else if (category === "body_parts") {
    const geo = new THREE.CylinderGeometry(0.25 * scale, 0.25 * scale, 1.2 * scale, 12);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0.9 * scale, 0, 0);
  } else {
    const geo = new THREE.OctahedronGeometry(0.3 * scale);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(1.2 * scale, 0.5, 0);
  }

  mesh.name = `equip-${item.id}`;
  equippedGroup.add(mesh);
  console.log("Added equipped mesh:", mesh.name, "at position:", mesh.position, "with assetType:", assetType);
}

function removeEquippedModel(itemId) {
  const equippedGroup = avatarScene ? avatarScene.getObjectByName("equipped-items") : null;
  if (!equippedGroup) return;
  const mesh = equippedGroup.getObjectByName(`equip-${itemId}`);
  if (mesh) {
    equippedGroup.remove(mesh);
    disposeEquippedObject(mesh);
  }
}

avatarNavButton.addEventListener("click", () => navigateTo("/avatar"));
