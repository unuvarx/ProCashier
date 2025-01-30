$(document).ready(function () {
    $('.addTable button, .add-table-btn').click(function () {
        try {
            const addCategorie = $('.addCategorie');
            addCategorie.css('display', 'flex');
            setTimeout(() => addCategorie.css('opacity', '0.9'), 10); 
        }
        catch (e) {
            console.error(e);
        }

       
    });

   
    $('.addCategorie .close-icon').click(function () {
        try {
            const addCategorie = $('.addCategorie');
            addCategorie.css('opacity', '0');
            setTimeout(() => addCategorie.css('display', 'none'), 500); 
        }
        catch (e) {
            console.error(e);
        }
       
    });
    $('#category-name').on('input', function () {
        try {
           
            var uppercasedValue = $(this).val().toUpperCase();
            $(this).val(uppercasedValue);
        }
        catch (e) {
            console.error(e);
        }
       
    });
});
