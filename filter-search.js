<script>
  const state = {
    loading: false,
    error: null,
    selectedServices: [],
    services: [],
    specialtiesOptions: [],
    specialties: [],
    offeringsOptions: [],
    offerings: [],
    search: "",
    location: "",
    reviews: 0,
    therapists: [],
  };

  const API_BASE = "https://c592e6df50.nxcli.io/wp-json/supabase/v1/v_therapists_verified";

  function fetchData(action, successCallback) {
    $.ajax({
      url: `${API_BASE}?action=${action}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      success: successCallback,
      error: (xhr, status, error) => console.error(`Failed to fetch ${action}:`, error)
    });
  }

  function fetchAvailableServices() {
    fetchData("get_available_services", data => {
      state.services = Array.isArray(data) ? data : [];
      renderCheckboxes(".dropdown_services", state.services, "service");
    });
  }

  function fetchSpecialties() {
    fetchData("get_specialties", data => {
      state.specialtiesOptions = Array.isArray(data) ? data : [];
      renderCheckboxes(".dropdown_specialties", state.specialtiesOptions, "specialty");
    });
  }

  function fetchOfferings() {
    fetchData("get_offerings", data => {
      state.offeringsOptions = Array.isArray(data) ? data : [];
      renderCheckboxes(".dropdown_offerings", state.offeringsOptions, "offering");
    });
  }

  // Render reusable checkbox list
  function renderCheckboxes(containerSelector, items, type) {
    const $container = $(containerSelector).empty();
    const html = items.map(item => {
      const slug = item.toLowerCase().replace(/\s+/g, "-");
      return `
        <label class="checkbox_field">
          <span>
            <div class="checkbox_input"></div>
            <input type="checkbox" value="${item}" class="${type}-checkbox ${type}-item-${slug}">
            ${item}
          </span>
        </label>
      `;
    }).join("");
    $container.append(html);
  }

function fetchTherapists() {
  state.loading = true;
  updateUI();

  const params = new URLSearchParams({ action: "get_therapists", is_verified: "true" });

  if (state.selectedServices.length) params.append("services", state.selectedServices.join(","));
  if (state.specialties.length) params.append("specialties", state.specialties.join(","));
  if (state.offerings.length) params.append("offerings", state.offerings.join(","));
  if (state.search) params.append("search", state.search);
  if (state.location) params.append("loc", state.location);
  if (state.reviews) params.append("reviews", state.reviews);

  $.ajax({
    url: `${API_BASE}?${params.toString()}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    success: data => {
      try {
        const maleImg = "https://cdn.prod.website-files.com/6745ebb40685734b722774c6/681e9cf247c40f4a4747f7c0_male-therapist.png";
        const femaleImg = "https://cdn.prod.website-files.com/6745ebb40685734b722774c6/681e9cf2e9ce487788ae8234_female-therapist.png";

        state.therapists = Array.isArray(data) ? data : [];

        // Sort: therapists with real profile images come first
        state.therapists.sort((a, b) => {
          const aImg = a.profile_url?.trim() ?? "";
          const bImg = b.profile_url?.trim() ?? "";

          const aIsDefault = !aImg || aImg.includes(maleImg) || aImg.includes(femaleImg);
          const bIsDefault = !bImg || bImg.includes(maleImg) || bImg.includes(femaleImg);

          return aIsDefault - bIsDefault; 
        });

        const noFilters = !state.search && !state.location && !state.selectedServices.length && !state.specialties.length && !state.offerings.length;
        if (!state.therapists.length && noFilters) {
          state.error = null;
          fetchTherapists();
          return;
        } else if (!state.therapists.length) {
          state.error = "Uh oh! No therapists found matching your search.";
        } else {
          state.error = null;
        }
      } catch (e) {
        console.error(e);
        state.error = "Error processing therapist data.";
        state.therapists = [];
      }

      state.loading = false;
      updateUI();
    },
    error: (xhr, status, error) => {
      state.loading = false;
      state.error = `Failed to fetch therapists. Status: ${xhr.status}. Error: ${error}`;
      state.therapists = [];
      updateUI();
    }
  });
}


  function updateUI() {
    const $container = $(".therapist-container").empty();
    const $error = $("#error-container").empty();

    if (state.loading) {
      $container.html(`<div class="preloader-search"><div class="spinner"></div><p class="text-size-medium">Loading therapists...</p></div>`);
      return;
    }

    if (state.error || !state.therapists.length) {
      $error.html(`<div class="empty-therapist"><p class="text-size-large">Uh oh! ${state.error || "No therapists available yet in your area."}</p></div>`);
      return;
    }

    state.therapists.forEach(t => {
      if (!t.display_name?.trim()) return;

      const gender = t.gender?.toLowerCase();
      const maleImg = "https://cdn.prod.website-files.com/6745ebb40685734b722774c6/681e9cf247c40f4a4747f7c0_male-therapist.png";
      const femaleImg = "https://cdn.prod.website-files.com/6745ebb40685734b722774c6/681e9cf2e9ce487788ae8234_female-therapist.png";
    
      let profileImg = t.profile_url?.trim();
      if (!profileImg) {
        profileImg = gender === "female" ? femaleImg : maleImg;
      }
    
      const specialties = (t.specialties || []).map(s => `
        <div class="specialty-item">
          <div class="check sm"></div>
          <div class="specialty-text">${s}</div>
        </div>`).join("");
    
      const insurances = t.insurances_accepted || [];
      const insuranceText = insurances.slice(0, 3).join(", ");
      const moreInsurances = insurances.length > 3 ? `+${insurances.length - 3} more` : "";
      const rating = t.average_rating ?? 0;
      const reviews = t.total_reviews ?? 0;
      const profileLink = `${location.origin}/therapists/therapist-bio?u=${t.username}`;
    

      $container.append(`
        <div class="therapist-item">
          <a href="${profileLink}" target="_blank"><img class="therapist-img" src="${profileImg}" alt="${t.display_name}'s profile photo" /></a>
          <div class="therapist-info">
            <h5 class="thera-name">${t.display_name}</h5>
            <div class="thera-position">${t.licenses?.[0]?.license_type || ""}</div>
            <div class="review-wrapper">
              ${rating > 0 ? `<div class="reviews"><div class="icon-sm star"></div><div class="rating-num">${Math.floor(rating)}</div><div class="rating-total">${reviews} reviews</div></div>` : ""}
              ${t.city || t.state ? `<div class="reviews"><div class="icon-sm location"></div><div class="thera-location">${[t.city, t.state].filter(Boolean).join(", ")}</div></div>` : ""}
              ${insurances.length ? `<div class="reviews"><div class="icon-sm shield"></div><div class="thera-insurance">${insuranceText}${moreInsurances}</div></div>` : ""}
            </div>
            <div class="speciality-lists">${specialties}</div>
            <p class="therapist-summary">${t.profile_headline ?? ""}</p>
          </div>
          <div class="therapist-buttonwrp">
            <div class="verified-tag">
              <img class="icon-32" src="https://cdn.prod.website-files.com/6745ebb40685734b722774c6/677ff8220ec215e2c7138cc4_award_svgrepo.com.svg" />
              <div>License Verified</div>
            </div>
            <a class="button" href="${profileLink}">View Profile</a>
          </div>
        </div>
      `);
    });
  }

  $(document).ready(function () {
    fetchAvailableServices();
    fetchSpecialties();
    fetchOfferings();
    fetchTherapists();

    // Reset All
    $(document).on("click", "#reset-all", () => {
      Object.assign(state, {
        selectedServices: [], specialties: [], offerings: [], search: "", location: "", reviews: 0
      });
      $(".service-checkbox, .specialty-checkbox, .offering-checkbox").prop("checked", false);
      $(".checkbox_input").removeClass("checked");
      $("#search-input, #location-input").val("");
      $(".filter-tagwrapper").empty();
      fetchTherapists();
    });


$(document).on("change", ".service-checkbox, .specialty-checkbox, .offering-checkbox", function () {
  const $checkbox = $(this);
  const value = $checkbox.val();
  const slug = value.toLowerCase().replace(/\s+/g, "-");

  const type = $checkbox.hasClass("service-checkbox")
    ? "service"
    : $checkbox.hasClass("specialty-checkbox")
    ? "specialty"
    : "offering";

  const listMap = {
    service: "selectedServices",
    specialty: "specialties",
    offering: "offerings"
  };

  const selectedList = state[listMap[type]];

  if ($checkbox.is(":checked")) {
    $checkbox.siblings(".checkbox_input").addClass("checked");

    if (!selectedList.includes(value)) {
      selectedList.push(value);
      $(".filter-tagwrapper").append(`
        <div class="filter-tag selected-${type}-${slug}">
          <div>${value}</div>
          <div data-${type}='${slug}' class="filter-close"></div>
        </div>
      `);
    }
  } else {
    $checkbox.siblings(".checkbox_input").removeClass("checked");
    state[listMap[type]] = selectedList.filter(item => item !== value);
    $(`.selected-${type}-${slug}`).remove();
  }

  state.page = 1;
  fetchTherapists();
});


    // Remove filter tag
    $(document).on("click", ".filter-close", function () {
      const $close = $(this);
      const $tag = $close.closest(".filter-tag");
      const value = $tag.find("div:first").text();
      const type = $close.attr("class").match(/data-(\w+)/)?.[1];

      if (type) {
        const stateList = state[type + (type === "specialty" ? "ies" : "s")];
        const idx = stateList.indexOf(value);
        if (idx !== -1) stateList.splice(idx, 1);
        $(`.${type}-checkbox[value="${value}"]`).prop("checked", false).siblings(".checkbox_input").removeClass("checked");
      }
      $tag.remove();
      fetchTherapists();
    });

    // Debounced search and location
    const debounce = (fn, delay) => {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    };

    $("#search-input").on("input", debounce(function () {
      state.search = $(this).val().trim();
      fetchTherapists();
    }, 300));

    $("#location-input").on("input", debounce(function () {
      state.location = $(this).val().trim();
      fetchTherapists();
    }, 300));
    console.log(state.location);
  });
</script>
