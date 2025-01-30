$(document).ready(function () {
    $('#barcode').on('input', function () {
        try {
            $(this).val($(this).val().replace(/[^\d]/g, ''));
        }
        catch (e) {
            console.error(e);
        }
       
    });

    $(document).on('input', '#price', function () {
        try {
            let value = $(this).val();
            $(this).val(value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.?\d{0,2}).*/, '$1'));
        }
        catch (e) {
            console.error(e);
        }
       


    });


    $('#name').on('input', function () {
        try {
            var uppercasedValue = $(this).val().toUpperCase();
            $(this).val(uppercasedValue);
        }
        catch (e) {
            console.error(e);
        }
        
        
    });


});