$(document).ready(function () {
    $('#nameSurname').on('input', function () {
        // Küçük harfleri büyük harfe dönüştür
        try {
            var uppercasedValue = $(this).val().toUpperCase();
            $(this).val(uppercasedValue);
        }
        catch (e) {
            console.error(e);
        }
        
    });


})