$(document).ready(function () {


    $('#phoneNumber').on('input', function () {

        try {
            var inputVal = $(this).val();
            // Sadece rakam kontrolü için regex deseni
            var numberPattern = /^[0-9]*$/;

            if (!numberPattern.test(inputVal)) {
                // Eğer input desenle eşleşmiyorsa, son geçerli değeri koru
                $(this).val($(this).val().replace(/\D/g, ''));
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });


    $('form').submit(function () {
        try {
            showPreloader();
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $('#carriersForm').submit(function () {
        try {
            showPreloader();
        }
        catch (e) {
            console.error(e);
        }
       
    });

    $('#waitersForm').submit(function () {
        try {
            showPreloader();
        }
        catch (e) {
            console.error(e);
        }
        
    });

    function showPreloader() {
        try {
            $('.preloader').css('display', 'flex');
        }
        catch (e) {
            console.error(e);
        }
        
    }

    try {
        setTimeout(function () {
            $('.preloader').css('display', 'none');
        }, 4000); // 2 seconds delay, adjust as necessary
    }
    catch (e) {
        console.error(e);
    }
   
});
