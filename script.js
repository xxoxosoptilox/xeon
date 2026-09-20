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
const userInitialTargets = document.querySelectorAll("[data-user-initial]");
const robuxBalanceTargets = document.querySelectorAll("[data-robux-balance]");
const apiBase = "";
const sidebarToggle = document.querySelector("#sidebar-toggle");
const settingsButton = document.querySelector("#settings-button");
const accountMenu = document.querySelector("#account-menu");
const logoutButton = document.querySelector("#logout-button");

function showMessage(text) {
  message.textContent = text;
}

function openHomeScreen() {
  blackScreen.hidden = false;
  setTimeout(() => {
    blackScreen.hidden = true;
    signupCard.hidden = true;
    loginCard.hidden = true;
    homeScreen.hidden = false;
  }, 900);
}

function showHomeFor(username) {
  const safeUsername = username.trim() || "User";
  localStorage.setItem("xedraUsername", safeUsername);
  userNameTargets.forEach((target) => { target.textContent = safeUsername; });
  userInitialTargets.forEach((target) => { target.textContent = safeUsername.charAt(0).toUpperCase(); });
  robuxBalanceTargets.forEach((target) => { target.textContent = safeUsername.toLowerCase() === "roblox" ? "∞" : "0"; });
  openHomeScreen();
}

function restoreHomeScreen() {
  const savedUsername = localStorage.getItem("xedraUsername");
  if (!savedUsername) {
    return;
  }
  userNameTargets.forEach((target) => { target.textContent = savedUsername; });
  userInitialTargets.forEach((target) => { target.textContent = savedUsername.charAt(0).toUpperCase(); });
  robuxBalanceTargets.forEach((target) => { target.textContent = savedUsername.toLowerCase() === "roblox" ? "∞" : "0"; });
  signupCard.hidden = true;
  loginCard.hidden = true;
  blackScreen.hidden = true;
  homeScreen.hidden = false;
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
      body: JSON.stringify({ username, password, birthday, gender: genderButton?.dataset.gender })
    });
    const result = await response.json();
    if (!response.ok) {
      showMessage(result.error || "Could not create the account.");
      return;
    }
    blackScreen.setAttribute("aria-hidden", "false");
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

function showLoginMessage(text) {
  loginMessage.textContent = text;
}

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
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (!response.ok) {
      showLoginMessage(result.error || "Invalid username or password.");
      return;
    }
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

restoreHomeScreen();

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

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("xedraUsername");
  sessionStorage.clear();
  accountMenu.hidden = true;
  homeScreen.hidden = true;
  blackScreen.hidden = true;
  loginCard.hidden = false;
  signupCard.hidden = true;
  setView("login");
  document.querySelector("#login-username").value = "";
  document.querySelector("#login-password").value = "";
});
