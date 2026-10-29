$(function () {
  const componentPaths = {
    header: "components/header.html?v=" + Date.now(),
    banner: "components/banner.html?v=" + Date.now(),
    footer: "components/footer.html?v=" + Date.now()
  };

  let toolsMenuTimer = null;

  function closeNavigation() {
    const $menuToggle = $(".menu-toggle");
    $menuToggle.attr("aria-expanded", "false").attr("aria-label", "Open navigation");
    $("#primary-navigation").removeClass("is-open");
    closeToolsMenu(true);
  }

  function openToolsMenu(focusFirstLink) {
    const $toggle = $(".site-nav__dropdown-toggle");
    const $menu = $("#tools-menu");
    if (!$menu.length) return;

    clearTimeout(toolsMenuTimer);
    $toggle.attr("aria-expanded", "true");
    $menu.removeClass("is-closing");
    $menu.prop("hidden", false);
    if ($menu[0]) {
      void $menu[0].offsetHeight;
    }
    $menu.addClass("is-open");

    if (focusFirstLink) {
      $menu.find("a").first().trigger("focus");
    }
  }

  function closeToolsMenu(immediate) {
    const $toggle = $(".site-nav__dropdown-toggle");
    const $menu = $("#tools-menu");
    if (!$menu.length) return;

    clearTimeout(toolsMenuTimer);
    $toggle.attr("aria-expanded", "false");
    $menu.removeClass("is-open");

    if (immediate) {
      $menu.removeClass("is-closing").prop("hidden", true);
      return;
    }

    $menu.addClass("is-closing");
    toolsMenuTimer = setTimeout(function () {
      if ($toggle.attr("aria-expanded") === "false") {
        $menu.removeClass("is-closing").prop("hidden", true);
      }
    }, 200);
  }

  function initializeNavigation() {
    const currentPage = $("body").attr("data-page");
    const $navigation = $("#primary-navigation");
    const $menuToggle = $(".menu-toggle");

    $navigation.find("[data-nav-page]").each(function () {
      const isCurrentPage = $(this).attr("data-nav-page") === currentPage;
      $(this).toggleClass("is-active", isCurrentPage);
      if (isCurrentPage) {
        $(this).attr("aria-current", "page");
      } else {
        $(this).removeAttr("aria-current");
      }
    });

    $navigation.find("[data-nav-page].is-active").closest(".site-nav__dropdown").find(".site-nav__dropdown-toggle").addClass("is-active");
    const $toolsToggle = $navigation.find(".site-nav__dropdown-toggle");
    const $toolsDropdown = $navigation.find(".site-nav__dropdown");

    $toolsToggle.off("click.unitwiseNavigation").on("click.unitwiseNavigation", function (event) {
      event.preventDefault();
      const isExpanded = $(this).attr("aria-expanded") === "true";
      if (isExpanded) {
        closeToolsMenu();
      } else {
        openToolsMenu();
      }
    });

    $toolsDropdown.off(".unitwiseNavigationHover")
      .on("mouseenter.unitwiseNavigationHover", function () {
        if (window.matchMedia("(min-width: 769px)").matches) {
          openToolsMenu();
        }
      })
      .on("mouseleave.unitwiseNavigationHover", function () {
        if (window.matchMedia("(min-width: 769px)").matches && !$.contains(this, document.activeElement)) {
          closeToolsMenu();
        }
      });

    $toolsDropdown.off("focusout.unitwiseNavigation").on("focusout.unitwiseNavigation", function () {
      setTimeout(function () {
        if (!$.contains($toolsDropdown[0], document.activeElement) && $toolsDropdown[0] !== document.activeElement) {
          closeToolsMenu();
        }
      }, 10);
    });

    $toolsToggle.off("keydown.unitwiseNavigation").on("keydown.unitwiseNavigation", function (event) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openToolsMenu(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeToolsMenu();
      }
    });

    $("#tools-menu").off("keydown.unitwiseNavigation").on("keydown.unitwiseNavigation", "a", function (event) {
      const $links = $("#tools-menu a");
      const index = $links.index(this);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        $links.eq((index + step + $links.length) % $links.length).trigger("focus");
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeToolsMenu();
        $toolsToggle.trigger("focus");
      }
    });

    $menuToggle.off("click.unitwiseNavigation").on("click.unitwiseNavigation", function () {
      const isExpanded = $(this).attr("aria-expanded") === "true";
      $(this)
        .attr("aria-expanded", String(!isExpanded))
        .attr("aria-label", isExpanded ? "Open navigation" : "Close navigation");
      $navigation.toggleClass("is-open", !isExpanded);
    });

    $navigation.off("click.unitwiseNavigation", "a")
      .on("click.unitwiseNavigation", "a", closeNavigation);
    $(document).off("click.unitwiseNavigationOutside").on("click.unitwiseNavigationOutside", function (event) {
      if (!$(event.target).closest(".site-nav__dropdown").length) closeToolsMenu();
    });
  }

  function loadComponent(name, fallback, onLoaded) {
    const $mount = $("#" + name);
    if (!$mount.length) {
      if (name !== "banner") {
        console.error("Unitwise could not find the #" + name + " component mount.");
      }
      return;
    }

    $mount.load(componentPaths[name], function (response, status, request) {
      if (status === "error") {
        console.error("Unitwise failed to load " + componentPaths[name] + ".", request.status, request.statusText);
        $mount.html('<p class="component-error" role="alert">' + fallback + "</p>");
        return;
      }
      if (typeof onLoaded === "function") {
        onLoaded();
      }
      if (name === "footer") {
        $("#current-year").text(new Date().getFullYear());
      }
    });
  }

  $(document).off("keydown.unitwiseNavigation").on("keydown.unitwiseNavigation", function (event) {
    if (event.key === "Escape") {
      closeNavigation();
    }
  });

  $(window).off("resize.unitwiseNavigation").on("resize.unitwiseNavigation", function () {
    if (window.matchMedia("(min-width: 769px)").matches) {
      closeNavigation();
    }
  });

  $(document).off("click.unitwiseFaq", ".faq-question")
    .on("click.unitwiseFaq", ".faq-question", function () {
      const $button = $(this);
      const isExpanded = $button.attr("aria-expanded") === "true";
      const $answer = $("#" + $button.attr("aria-controls"));

      $(".faq-question").not($button).attr("aria-expanded", "false");
      $(".faq-answer").not($answer).prop("hidden", true);
      $button.attr("aria-expanded", String(!isExpanded));
      $answer.prop("hidden", isExpanded);
    });

  loadComponent("header", "Navigation is temporarily unavailable.", initializeNavigation);
  loadComponent("banner", "");
  loadComponent("footer", "Footer content is temporarily unavailable.");
});
