$(document).ready(function () {

    try {
        $('#userAuth').click(function () {
            $('#userAuth').css('color', 'cornflowerblue');
            $('#userAuth').css('border-color', 'cornflowerblue');
            $('#carriers').css('color', 'black');
            $('#carriers').css('border-color', 'lightgray');
            $('#waiters').css('color', 'black');
            $('#waiters').css('border-color', 'lightgray');


            $('#userAuthForm').css('display', 'block');
            $('#waitersForm').css('display', 'none');
            $('#carriersForm').css('display', 'none');
        });
    }
    catch (e) {
        console.error(e);
    }
   
    try {
        $('#carriers').click(function () {
            $('#carriers').css('color', 'cornflowerblue');
            $('#carriers').css('border-color', 'cornflowerblue');
            $('#userAuth').css('color', 'black');
            $('#userAuth').css('border-color', 'lightgray');
            $('#waiters').css('color', 'black');
            $('#waiters').css('border-color', 'lightgray');


            $('#carriersForm').css('display', 'block');
            $('#waitersForm').css('display', 'none');
            $('#userAuthForm').css('display', 'none');
        });
    }
    catch (e) {
        console.error(e);
    }

    
        $('#waiters').click(function () {
            try {
                $('#waiters').css('color', 'cornflowerblue');
                $('#waiters').css('border-color', 'cornflowerblue');
                $('#carriers').css('color', 'black');
                $('#carriers').css('border-color', 'lightgray');
                $('#userAuth').css('color', 'black');
                $('#userAuth').css('border-color', 'lightgray');


                $('#waitersForm').css('display', 'block');
                $('#userAuthForm').css('display', 'none');
                $('#carriersForm').css('display', 'none');
            }
            catch (e) {
                console.error(e);
            }
        });
    
    $('#userAuthForm').submit(function () {
        
        showPreloader();
    });
    

    $('#carriersForm').submit(function () {
        showPreloader();
    });
    
    
   
        $('#waitersForm').submit(function () {
            showPreloader();
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
