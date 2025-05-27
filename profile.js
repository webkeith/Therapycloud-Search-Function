<script>
  $(document).ready(function () {
    const $preloader = $('.preloader');
    const $contactSection = $('#contact-provider');

    // Initially hide contact section and show preloader
    $contactSection.hide();
    $preloader.show();

    const info = JSON.parse(localStorage.getItem('therapist_info'));
    if (!info) {
      console.warn('No therapist_info found.');
      $preloader.hide();
      return;
    }

    $('#provider-avatar').attr('src', info.profile_image);
    $('#provider-name').text(info.name);
    $('#provider-email').text(info.email);

    const $wrapper = $('.accept-wrapper');
    $wrapper.removeClass('accepting not-accepting');
    $wrapper.addClass(info.taking_new_clients ? 'accepting' : 'not-accepting');

    $('#therapistname').val(info.name);
    $('#therapistemail').val(info.email);

    // Reveal content and hide preloader after short delay
    setTimeout(() => {
      $preloader.fadeOut(200, function () {
        $contactSection.fadeIn(300);
      });
    }, 300); // Optional delay for smoother UX
  });
</script>
