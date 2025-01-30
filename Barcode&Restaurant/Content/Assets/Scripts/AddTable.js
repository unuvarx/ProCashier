$(document).ready(function () {
    
    $('.tableName').on('input', function () {
        try {
            $(this).val($(this).val().toUpperCase());
        }
        catch (e) {
            console.error(e);
        }
       
    });

    let tableCategories = [];
    $.ajax({
        url: '/Reckoning/GetTableCategories',
        type: 'GET',
        dataType: 'json',
        success: function (response) {

            try {
                tableCategories = response;
               
                AddSelect();
            }
            catch (e) {
                console.error(e);
            }
        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    });

    const AddSelect = () => {
        try {
            $('#categorieSelect').empty();
            let option = ``;
            let categorieId = parseInt($('input[name="tableCategorieId"]').val());
            
            if (categorieId) {
                tableCategories.forEach(category => {
                    option += `<option ${categorieId === category.TableCategorieId ? "selected" : ""} value="${category.TableCategorieId}">${category.TableCategorieName}</option>`;
                });
            }
            else {
                tableCategories.forEach(category => {
                    option += `<option  value="${category.TableCategorieId}">${category.TableCategorieName}</option>`;
                });
            }
            $('#categorieSelect').append(option);
        }
        catch (e) {
            console.error(e);
        }
        

    }

   
    $('#AddTableForm').on('submit', function (e) {
        try {
            e.preventDefault();
            let formData = $(this).serialize(); // Form verilerini serialize et
            $.ajax({
                url: $(this).attr('action'), // Formun action özelliğini al
                type: $(this).attr('method'), // Formun method özelliğini al
                data: formData, // Form verilerini gönder
                success: function (response) {
                    
                    $('.message').html(response.message); // Geri bildirim mesajını gösterin
                    $('.tableName').val('');
                },
                error: function (xhr, status, error) {
                    console.error(error);
                    $('.message').html('Bir hata oluştu. Lütfen tekrar deneyin.'); // Hata mesajını gösterin
                }
            });
        }
        catch (e) {
            console.error(e);
        }
       
    });
});