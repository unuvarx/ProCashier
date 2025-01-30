$(document).ready(function () {

  
        let productId = $('input[name="ProductId"]').val();
    
    
   

    $(document).on('input', 'input[name="optionprice"]', function () {
        try {
            let value = $(this).val();

            $(this).val(value.replace(/[^\d\.]/g, '').replace(/(\..*)\./g, '$1'));
        }
        catch (e) {
            console.error(e);
        }
       
    });

    // input[name="productPrice"] alanı için input olayını dinleyelim
    $('input[name="productPrice"]').on('input', function () {
        try {
            let value = $(this).val();

            $(this).val(value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.?\d{0,2}).*/, '$1'));
        }
        catch (e) {
            console.error(e);
        }
        
    });

    
   

    // Fetch product details on page load
    fetchProductDetails(productId);

    // Fetch product details
    function fetchProductDetails(productId) {
        try {
            $.ajax({
                url: `/Reckoning/GetSingleMenuProduct/${productId}`,
                type: 'GET',
                dataType: 'json',
                success: function (response) {
                    if (response && response.length > 0) {
                        let product = response[0];
                        populateForm(product);
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Error fetching product details:", error);
                }
            });
        }
        catch (e) {
            console.error(e);
        }
       
    }


    function populateForm(product) {
        try {
            $('input[name="productName"]').val(product.ProductName);
            $('input[name="productPrice"]').val(product.ProductPrice);
        }
        catch (e) {
            console.error(e);
        }
       

    }

    // Form submission
    $('form').submit(function (event) {
        try {
            event.preventDefault();

            let formData = new FormData();
            formData.append('ProductId', $('input[name="ProductId"]').val());
            formData.append('CategoryId', $('input[name="CategoryId"]').val());
            formData.append('ProductName', $('input[name="productName"]').val());
            formData.append('ProductPrice', $('input[name="productPrice"]').val());





            // AJAX request to update product
            $.ajax({
                url: `/Reckoning/UpdateMenuProduct/${productId}`,
                type: 'PUT',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    window.location.href = `/Reckoning/MenuCategories/${$('input[name="CategoryId"]').val()}`;
                },
                error: function (xhr, status, error) {
                    console.error("Error updating product:", error);
                }
            });
        }
        catch (e) {
            console.error(e);
        }
        
    });
});
