const loginFormHandler = async (event) => {
  event.preventDefault();

  const email = document.querySelector("#email-input").value.trim();
  const password = document.querySelector("#password-input").value.trim();

  if (email && password) {
    const response = await fetch("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      document.location.replace("/");
    } else {
      validationModal("Darn!! Login Failed", "Please enter valid email (xyz@example.com) and password (minimum of six characters).");
    }
  }
};

// ADD VALIDATION MODAL BASED ON USER INPUT
function validationModal(title, body) {
$("#no-input-model").modal("show");
$("#no-input-title").text(title);
$("#no-input-body").text(body);
}

document
  .querySelector(".login-form")
  .addEventListener("submit", loginFormHandler);
