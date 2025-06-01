<script>
$(document).ready(() => {
  $(".therapist-information, .therapist-error").hide();

  const getUrlParam = (name) => {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  };

  const storeTherapistInfo = (therapist) => {
    const fullName = therapist.display_name || [therapist.first_name, therapist.last_name].filter(Boolean).join(" ");
    const email = therapist.email || "";
    const takingNewClients = !!therapist.accept_new_clients;
    const profileImage = therapist.profile_url || "https://cdn.prod.website-files.com/6745ebb40685734b722774c6/681e9cf247c40f4a4747f7c0_male-therapist.png";

    localStorage.setItem("therapist_info", JSON.stringify({
      name: fullName,
      email,
      taking_new_clients: takingNewClients,
      profile_image: profileImage
    }));
  };

  const username = getUrlParam("u");

  const state = { loading: true, therapist: {}, error: null };
  const EDGE_FUNCTION_URL = "https://c592e6df50.nxcli.io/wp-json/supabase/v1/v_therapists_verified?username=" + encodeURIComponent(username);

  const updateText = (id, value = "") => $(`#${id}`).text(value);
  const updateHTML = (id, html = "") => $(`#${id}`).html(html);
  const updateList = (id, items) =>
    updateHTML(id, items.map(item => `<li class="list-item-medium"><div class="text-size-medium text-weight-bold">${item}</div></li>`).join(""));
  const toggleClass = (id, condition) => {
    $(`#${id}`).removeClass("check uncheck").addClass(condition ? "check" : "uncheck");
  };

  $('#schedule-visit').on('click', (e) => {
    e?.preventDefault();
    localStorage.removeItem("therapist_info");
    storeTherapistInfo(state.therapist);

    if (state.therapist.email && e?.target.id === "schedule-visit") {
      const contactUrl = `/therapists/contact-provider?provider_email=${encodeURIComponent(state.therapist.email)}`;
      window.location.href = contactUrl;
    }
  });
  
$('#leave-review').on('click', (e) => {
  e?.preventDefault();
  localStorage.removeItem("therapist_review_info");

  if (state.therapist) {
    const therapistReviewInfo = {
      name: state.therapist.display_name || [state.therapist.first_name, state.therapist.last_name].filter(Boolean).join(" "),
      therapist_id: state.therapist.id || "",  
      email: state.therapist.email || "",
      user_id: state.therapist.user_id || ""
    };

    localStorage.setItem("therapist_review_info", JSON.stringify(therapistReviewInfo));
  }
  window.location.href = "/therapists/leave-a-review";
});

  const updateUI = () => {
    const { therapist, error } = state;

    $(".therapist-information, .therapist-error").hide();

    if (error || !therapist || Object.keys(therapist).length === 0) {
      $(".therapist-information").empty();
      $(".preloader").fadeOut(500, () => {
        $(".therapist-error").fadeIn();
        $("body").css("overflow", "auto");
      });
      return;
    }

    $(".preloader").fadeOut(500, () => {
      $(".therapist-information").fadeIn();
      $("body").css("overflow", "auto");
    });

    const getFullName = ({ first_name, last_name, display_name }) =>
      display_name || [first_name, last_name].filter(Boolean).join(" ");
    const getLocation = ({ city, state, location }) =>
      [city, state].filter(Boolean).join(", ") || location || "";
    const getSecondLocation = ({ secondary_addr }) => {
      if (!Array.isArray(secondary_addr) || secondary_addr.length === 0) return "";
      const { city = "", state = "", street_address = "" } = secondary_addr[0] || {};
      const parts = [street_address, city, state].filter(Boolean);
      return parts.join(", ");
    };



    let profileImageUrl = therapist.profile_url;
    const gender = (therapist.gender || "").toLowerCase();

    if (!profileImageUrl || profileImageUrl.trim() === "") {
      profileImageUrl = gender === "female"
        ? "https://cdn.prod.website-files.com/6745ebb40685734b722774c6/681e9cf2e9ce487788ae8234_female-therapist.png"
        : "https://cdn.prod.website-files.com/6745ebb40685734b722774c6/681e9cf247c40f4a4747f7c0_male-therapist.png";
    }

    $("#therapist-profile-image").attr("src", profileImageUrl);

    const defaultMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d206719.88709971498!2d14.39630705!3d35.9470131!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6a66574a7066ebb3%3A0x11e9f1c91c8c393!2sTherapy%20Cloud!5e0!3m2!1sen!2sph!4v1747863884644!5m2!1sen!2sph";
    const googleMapLink = therapist.google_link;

    if (googleMapLink && googleMapLink.trim() !== "") {
      $("#maplocation").attr("src", googleMapLink);
    } else {
      $("#maplocation").attr("src", defaultMapUrl);
    }

    const fullName = getFullName(therapist);
    updateText("therapist-name", fullName);
    updateText("therapist-review-name", fullName);
    $('#therapistname').val(fullName);
    updateText("therapist-profile-headline", therapist.profile_headline);
    updateHTML("therapist-personal-statement", (therapist.personal_statement || "").replace(/\n\n/g, "<br><br>"));
    updateText("therapist-approach-therapy", therapist.approach_therapy);
    updateText("therapist-phone", therapist.phone);
    updateText("therapist-email", therapist.email);
    updateText("therapist-businessname", therapist.business_name);
    updateText("therapist-location", getLocation(therapist));
    updateText("primary_loc", getLocation(therapist));
    updateText("secondary_loc", getSecondLocation(therapist));
    updateText("rating", therapist.average_rating);
    updateText("therapist-gender", therapist.gender);
    updateText("therapist-pronouns", therapist.pronoun);
    updateText("therapist-religion", therapist.religion === "Optional" ? "" : therapist.religion);
    updateText("therapist-ethnicity", therapist.ethnicity === "Optional" ? "" : therapist.ethnicity);
    updateText("therapist-languages", (therapist.languages_spoken || []).join(", "));

    if (
      !$.trim($("#primary_loc").text()) &&
      !$.trim($("#secondary_loc").text())
    ) {
      $(".location-block").hide();
    } else {
      $(".location-block").show();
    }
    
    if (therapist.website) {
      const cleanURL = therapist.website.replace(/^https?:\/\//, '').replace(/^www\./, '');
      $("#therapist-website").html(`<a href="https://${therapist.website}" class="text-size-medium _link field-answer" target="_blank">${cleanURL}</a>`);
    }
    
    const averageRating = Math.round((parseFloat(therapist.average_rating || 0)) * 10) / 10; // Round average rating to 1 decimal place
    const fullStars = Math.floor(averageRating); // Generate star icons based on rating
    const hasHalfStar = averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starHTML = '';
    for (let i = 0; i < fullStars; i++) {
    starHTML += '<span class="star-icon"></span>';
    }
    if (hasHalfStar) {
    starHTML += '<span class="star-icon half"></span>';
    }
    for (let i = 0; i < emptyStars; i++) {
    starHTML += '<span class="star-icon empty"></span>';
    }

   $('#star-rating').html(starHTML);
    const serviceChecks = {
      "therapist-individual-therapy": "Individual Therapy",
      "therapist-couples-counseling": "Couples Counseling",
      "therapist-family-therapy": "Family Therapy",
      "therapist-life-coaching": "Life Coaching",
      "therapist-group-coaching": "Group Coaching",
    };

    Object.entries(serviceChecks).forEach(([id, label]) =>
      toggleClass(id, (therapist.services_provided || []).includes(label))
    );

    const offeringChecks = {
      "therapist-offering-telehealth": "Telehealth",
      "therapist-offering-evening": "Evening",
      "therapist-offering-weekend": "Weekend",
    };

    Object.entries(offeringChecks).forEach(([id, label]) =>
      toggleClass(id, (therapist.offerings || []).includes(label))
    );

    toggleClass("therapist-accept-new-clients", !!therapist.accept_new_clients);
    toggleClass("therapist-accepts-insurance", (therapist.insurances_accepted || []).length > 0);

    const specialties = (typeof therapist.specialties === "string"
      ? therapist.specialties.split(",").map(s => s.trim())
      : therapist.specialties || []).filter(Boolean).sort().slice(0, 5);

    updateList("therapist-specialties", specialties);
    updateHTML("service_provided", [...new Set(therapist.services_provided || [])]
      .map(service => `<div class="checklist-item"><div class="check"></div><div class="text-size-medium blue-green">${service}</div></div>`)
      .join(""));
    updateList("therapist-populations-focus", therapist.populations_served || []);
    updateList("insurances_accepted", [...new Set(therapist.insurances_accepted || [])]);

    let hasFinanceData = false;
    let hasNonPaymentFee = false;

    $("[data-fees]").each(function () {
      const $el = $(this);
      const label = $el.data("fees");
      let value = "";

      if (label === "Payment") {
        const payments = therapist.payment_options || [];
        value = payments.length ? payments.join(", ") : "";
      } else {
        const fees = {
          "Individual Sessions": therapist.individual_session_fee,
          "Couple Sessions": therapist.couples_session_fee,
          "Family Therapy": therapist.family_therapy_fee,
          "Group Therapy": therapist.group_therapy_fee,
          "Life Coaching": therapist.life_coaching_fee
        };
        const fee = fees[label];
        value = fee ? `$${fee.toFixed(2)}` : "";
      }

      if (value) {
        hasFinanceData = true;
        if (label !== "Payment") {
          hasNonPaymentFee = true;
        }
      }

      $el.text(value);
    });

    if (!hasNonPaymentFee) {
      $(".finances-block").css("display", "none");
    } else { 
      $(".finances-block").css("display", "block");
    }

    
const gallery = therapist.gallery || []; // Gallery

if (Array.isArray(gallery) && gallery.length > 0) {
  const maxToShow = 4;
  const displayImages = gallery.slice(0, maxToShow);
 
  const galleryPreviewHTML = displayImages.map(url => // Limited static preview (up to 4 images)
    `<img src="${url}" class="gallery-item thumb">`).join('');
  $('#gallery-photo').html(galleryPreviewHTML);

  if (gallery.length > maxToShow) {
    $('.gallery-count').text(`+${gallery.length - maxToShow}`).show();
  } else {
    $('.gallery-count').hide();
  }

  $('.gallery-block').show();
  $('#main-gallery').html('');  // Clear and repopulate full Swiper sliders
  $('#main-gallerythumb').html('');

  gallery.forEach((url) => {
    const slideHTML = `
      <div class="swiper-slide gallery-item">
        <img src="${url}"/>
      </div>`;
    const thumbHTML = `
      <div class="swiper-slide thumbnail-item">
        <img src="${url}"/>
      </div>`;

    $('#main-gallery').append(slideHTML);
    $('#main-gallerythumb').append(thumbHTML);
  });

 
  galleryTop.update(); // Update Swipers
  galleryThumbs.update();
  } else {
    $('.gallery-block').hide();
  }

    // Video
    if (!therapist.intro_video || therapist.intro_video.trim() === "") {
      $(".intro-video-block").hide();
    } else {
      $(".intro-video-block").show();
      $("#intro-video").attr("src", therapist.intro_video);
    }

    // Licenses
    const licenseList = therapist.licenses || [];
    if (licenseList.length > 0) {
      const licenseHTML = licenseList.map(license =>
        `<div class="license-list">
          <div class="grid-item">
            <ul role="list">
              <li class="list-item-medium">
                <div class="text-size-medium">${license.license_type || '—'}</div>
              </li>
            </ul>
          </div>
          <div class="grid-item">
            <div class="text-size-medium">${(license.state && license.state.includes(":") ? license.state.split(":")[1].trim() : license.state) || '—'
}</div>
          </div>
          <div class="grid-item">
            <div class="text-size-medium">${license.license_num || '—'}</div>
          </div>
        </div>`).join("");
      $("#license").html(licenseHTML);
    } else {
      $(".licenses-block").hide();
    }

    // Education
    let eduHTML = "";
    const educationList = therapist.degrees || [];

    if (educationList.length > 0) {
      eduHTML = educationList.map(edu =>
        `<div class="educ-list-item">
          <div>
            <ul role="list">
              <li class="list-item-medium">
                <div class="text-size-medium">${edu.degree || ""} in ${edu.study || ""}</div>
              </li>
            </ul>
          </div>
          <div>
							<div class="text-size-medium">${edu.institute || ""}</div>
          </div>
        </div>`).join("");
      $("#edu").html(eduHTML);
    }else {
      $(".education-block").hide();
    }

  // Affiliations
    const affiliations = therapist.affiliations || [];

    if (Array.isArray(affiliations) && affiliations.length > 0) {
      const affiliationHTML = affiliations
        .filter(Boolean)
        .map(affil => `
          <ul role="list"> 
            <li class="list-item-medium">
              <div class="text-size-medium">${affil}</div>
            </li>
          </ul>`).join("");
      $("#affiliation").html(affiliationHTML);
    } else {
      $(".affiliation-block").hide(); 
    }


    // Certifications
    const certHTML = (therapist.certs || []).map(cert => {
      if (!cert.cred_type || cert.cred_type === "N/A") return '';
      return `<ul role="list" class="cert-name">
        <li class="list-item-medium">
          <div class="text-size-medium">${cert.cred_type}</div>
        </li>
      </ul>`;
    }).join("");

    if (certHTML.trim() === "") {
      $(".certifications-block").hide();
    } else {
      $("#certs").html(certHTML);
    }


    if ($("#therapist-populations-focus").is(":empty")) $(".population-block").hide();
    if ($("#insurances_accepted").is(":empty")) $(".insurance-block").hide();
    if (!therapist.affiliations && !eduHTML) $(".education-block").hide();
    if (!hasFinanceData) $(".finances-block").hide();
    if (!specialties.length) $(".specialties-block").hide();
    if (!$("#therapist-approach-therapy").text()?.trim()) {
      $(".approach").hide();
    }

    setTimeout(() => {
      $(".loading").fadeOut(500);
      $("body").css("overflow", "auto");

      $(".services-block").each(function () {
        if ($(this).find(".uncheck").length === 4) $(this).hide();
      });

      $(".offering-block").each(function () {
        if ($(this).find(".uncheck").length === 3) $(this).hide();
      });

      $(".website").toggle($('#therapist-website .field-answer').length > 0);
    }, 500);
  };

  // Always fetch fresh data
  $.ajax({
    url: EDGE_FUNCTION_URL,
    method: "GET",
    dataType: "json",
  })
    .done((response) => {
      if (response && response.length && response[0].username === username) {
        state.therapist = response[0];
        state.error = null;
      } else {
        state.error = "Therapist not found.";
      }
    })
    .fail(() => {
      state.error = "Failed to load therapist data.";
    })
    .always(() => {
      state.loading = false;
      updateUI();
    });
});
</script>