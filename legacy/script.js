gsap.fromTo(
  ".loading-page",
  { opacity: 1 },
  {
    opacity: 0,
    display: "none",
    duration: 2.5,
    delay: 3,
  }
);

gsap.fromTo(
  ".logo-name",
  {
    y: 50,
    opacity: 0,
  },
  {
    y: 0,
    opacity: 1,
    duration: 1,
    delay: 0.5,
  }
);

document.getElementById("selectEnglish").addEventListener("click", function() {
  triggerFadeOutAndShowActionPage('en');
});

document.getElementById("selectFrench").addEventListener("click", function() {
  triggerFadeOutAndShowActionPage('fr');
});

function triggerFadeOutAndShowActionPage(language) {
  const loadingPage = document.querySelector(".welcome-message");
  loadingPage.style.opacity = '0';  // Start fade-out effect

  // After the first fade-out is done, show the action page with the correct language
  setTimeout(function() {
      loadingPage.style.display = 'none'; // Hide the language selection screen
      const actionPage = document.getElementById("actionPage");
      const actionPrompt = document.getElementById("actionPrompt");
      const requestServicesButton = document.getElementById("requestServices");
      const viewPortfolioButton = document.getElementById("viewPortfolio");

      // Set text and URLs based on the selected language
      if (language === 'en') {
          actionPrompt.textContent = "What would you like to do?";
          requestServicesButton.textContent = "Request Services";
          viewPortfolioButton.textContent = "View Portfolio";
          requestServicesButton.setAttribute('data-url', 'Interactive/servicesen.html');
          viewPortfolioButton.setAttribute('data-url', 'Interactive/portfolioen.html');
      } else if (language === 'fr') {
          actionPrompt.textContent = "Que voulez-vous faire ?";
          requestServicesButton.textContent = "Demander des services";
          viewPortfolioButton.textContent = "Voir le portfolio";
          requestServicesButton.setAttribute('data-url', 'Interactive/services.html');
          viewPortfolioButton.setAttribute('data-url', 'Interactive/portfolio.html');
      }

      actionPage.classList.add('visible'); // Make the action page interactable
      actionPage.style.opacity = '1';  // Fade-in the action page
  }, 1000); // Match this duration with the CSS transition duration
}

document.getElementById("requestServices").addEventListener("click", function() {
  triggerFadeOutAndRedirect(this.getAttribute('data-url'));
});

document.getElementById("viewPortfolio").addEventListener("click", function() {
  triggerFadeOutAndRedirect(this.getAttribute('data-url'));
});

function triggerFadeOutAndRedirect(url) {
  const actionPage = document.querySelector(".action-page");
  actionPage.style.opacity = '0';  // Start fade-out effect

  // Delay the redirection to allow the fade-out effect to complete
  setTimeout(function() {
      window.location.href = url;
  }, 1000); // Match this duration with the fadeOut animation duration
}
document.getElementById("selectEnglish").addEventListener("click", function() {
  triggerFadeOutAndShowActionPage('en');
});

document.getElementById("selectFrench").addEventListener("click", function() {
  triggerFadeOutAndShowActionPage('fr');
});

function triggerFadeOutAndShowActionPage(language) {
  const loadingPage = document.querySelector(".loading-page");
  const welcomeMessage = document.querySelector(".welcome-message");

  // Start fade-out effect
  loadingPage.style.opacity = '0';
  welcomeMessage.style.opacity = '0';

  // After the fade-out is done, show the action page
  setTimeout(function() {
      loadingPage.style.display = 'none'; // Hide the loading screen
      welcomeMessage.style.display = 'none'; // Hide the welcome message
      const actionPage = document.getElementById("actionPage");
      const actionPrompt = document.getElementById("actionPrompt");
      const requestServicesButton = document.getElementById("requestServices");
      const viewPortfolioButton = document.getElementById("viewPortfolio");

      // Set text and URLs based on the selected language
      if (language === 'en') {
          actionPrompt.textContent = "What would you like to do?";
          requestServicesButton.textContent = "Request Services";
          viewPortfolioButton.textContent = "View Portfolio";
          requestServicesButton.setAttribute('data-url', 'Interactive/servicesen.html');
          viewPortfolioButton.setAttribute('data-url', 'Interactive/portfolioen.html');
      } else if (language === 'fr') {
          actionPrompt.textContent = "Que voulez-vous faire ?";
          requestServicesButton.textContent = "Demander des services";
          viewPortfolioButton.textContent = "Voir le portfolio";
          requestServicesButton.setAttribute('data-url', 'Interactive/services.html');
          viewPortfolioButton.setAttribute('data-url', 'Interactive/portfolio.html');
      }

      actionPage.classList.add('visible'); // Make the action page interactable
      actionPage.style.opacity = '1';  // Fade-in the action page
  }, 1000); // Match this duration with the CSS transition duration
}

document.getElementById("requestServices").addEventListener("click", function() {
  triggerFadeOutAndRedirect(this.getAttribute('data-url'));
});

document.getElementById("viewPortfolio").addEventListener("click", function() {
  triggerFadeOutAndRedirect(this.getAttribute('data-url'));
});

function triggerFadeOutAndRedirect(url) {
  const actionPage = document.querySelector(".action-page");
  actionPage.style.opacity = '0';  // Start fade-out effect

  // Delay the redirection to allow the fade-out effect to complete
  setTimeout(function() {
      window.location.href = url;
  }, 1000); // Match this duration with the fadeOut animation duration
}



        // Force a page refresh if the page is loaded from the cache (e.g., using the back button)
        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                window.location.reload();
            }
        });
