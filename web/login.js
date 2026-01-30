async function post(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");
const btnLogin = document.getElementById("btnLogin");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Validation
  if (!email) {
    errorMsg.textContent = "Please enter your email address";
    emailInput.focus();
    return;
  }

  if (!password) {
    errorMsg.textContent = "Please enter your password";
    passwordInput.focus();
    return;
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorMsg.textContent = "Please enter a valid email address";
    emailInput.focus();
    return;
  }

  // Disable button during login
  btnLogin.disabled = true;
  btnLogin.textContent = "Signing in...";
  errorMsg.textContent = "";

  try {
    const res = await post("/login", { email, password });
    const data = await res.json();

    if (res.status === 200 && data.ok) {
      // Store authentication state
      sessionStorage.setItem("authenticated", "true");
      sessionStorage.setItem("userEmail", data.user.email);

      // Show success message briefly
      btnLogin.textContent = "Success!";

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 500);
    } else {
      // Handle error response
      errorMsg.textContent =
        data.message || "Invalid email or password. Please try again.";
      btnLogin.disabled = false;
      btnLogin.textContent = "Sign In";
      passwordInput.value = "";
      passwordInput.focus();
    }
  } catch (error) {
    console.error("Login error:", error);
    errorMsg.textContent =
      "Connection error. Please check your internet and try again.";
    btnLogin.disabled = false;
    btnLogin.textContent = "Sign In";
  }
});

// Auto-focus email input on load
window.addEventListener("load", () => {
  emailInput.focus();
});

// Clear error message when user starts typing
emailInput.addEventListener("input", () => {
  if (errorMsg.textContent) {
    errorMsg.textContent = "";
  }
});

passwordInput.addEventListener("input", () => {
  if (errorMsg.textContent) {
    errorMsg.textContent = "";
  }
});
