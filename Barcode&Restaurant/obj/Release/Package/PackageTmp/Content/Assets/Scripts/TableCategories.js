$(document).ready(function () {



    $('.delete-categorie').on('click', function () {
        try {
            if (confirm('Bu kategoriyi sildiğinizde masaları da silinecek. Yine de devam etmek ister misiniz?')) {
                var categorieId = $(this).data('categorie-id');
             
                let formData = new FormData();
                formData.append('tableCategorieId', categorieId)
                $.ajax({
                    url: `/Reckoning/DeleteTableCategories`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {


                        window.location.href = `/Reckoning/TableCategories`;
                    },
                    error: function (xhr, status, error) {
                        console.error("Error updating product:", error);
                    }
                });

            }
        }
        catch (e) {
            console.error(e);
        }
        

        
    })






})