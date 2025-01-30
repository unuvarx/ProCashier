$(document).ready(function () {
   
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
    $('#productName').on('input', function () {
        try {
            // Küçük harfleri büyük harfe dönüştür
            var uppercasedValue = $(this).val().toUpperCase();
            $(this).val(uppercasedValue);
        }
        catch (e) {
            console.error(e);
        }
       
    });

    $('.delete-categorie .addProductBtn').click(function () {
        try {
            const addCategorie = $('.addProductModal');
            addCategorie.css('display', 'flex');
            setTimeout(() => addCategorie.css('opacity', '0.9'), 10);
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $('.addProductModal .close-icon').click(function () {
        try {
            const addCategorie = $('.addProductModal');
            addCategorie.css('opacity', '0');
            setTimeout(() => addCategorie.css('display', 'none'), 500);
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $('.deleteBtn').click(function () {
        try {
            let categoryId = $('input[name="CategoryId"]').val();
            $.ajax({
                url: `/Reckoning/DeleteMenuCategorie/${categoryId}`,
                type: 'PUT',
                success: function (response) {
                    window.location.href = '/Reckoning/Menu';
                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
        }
        catch (e) {
            console.error(e);
        }
        
    });

    

    
    $('form').submit(function (event) {
        try {
            event.preventDefault();

            // Prepare formData
            let formData = new FormData();
            formData.append('CategoryId', $('input[name="CategoryId"]').val());
            formData.append('ProductName', $('input[name="productName"]').val());
            formData.append('ProductPrice', $('input[name="productPrice"]').val());

            // AJAX request
            $.ajax({
                url: '/Reckoning/AddMenuProductReq',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                   
                    const addCategorie = $('.addProductModal');
                    addCategorie.css('opacity', '0');
                    setTimeout(() => addCategorie.css('display', 'none'), 500);
                    $('form')[0].reset();
                    options = [];
                    ingredients = [];
                    fetchMenuProducts();
                },
                error: function (xhr, status, error) {
                    console.error(error);
                    alert('Bir hata oluştu.');
                }
            });
        }
        catch (e) {
            console.error(e);
        }
        
    });

    function fetchMenuProducts() {
        try {
            let categoryId = $('input[name="CategoryId"]').val();
            $.ajax({
                url: `/Reckoning/GetMenuProducts/${categoryId}`,
                type: 'GET',
                dataType: 'json',
                success: function (response) {
                    updateProductList(response);
                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }

    function updateProductList(products) {
        try {
            const productsContainer = $('.products-container');
            productsContainer.empty();
            products.forEach(product => {
                const productHtml = `
                <div class="product">
                   <div class="edit-delete-product">
                        <a href="/Reckoning/EditMenuProduct/${product.ProductId}"><i class="fa fa-pencil" aria-hidden="true"></i></a>
                        <i class="fa fa-trash delete-product" aria-hidden="true" data-product-id="${product.ProductId}"></i>
                   </div >
                    <div class="content">
                        <span>Ürün Adı</span>
                        <input type="text" name="name" value="${product.ProductName}" disabled />
                    </div>
                    <div class="content">
                        <span>Ürün Fiyatı</span>
                        <input type="text" name="price" value="${product.ProductPrice}" disabled />
                    </div>
                </div>
            `;
                productsContainer.append(productHtml);
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Event delegation for dynamically added delete-product buttons
    $(document).on('click', '.delete-product', function () {
        try {
            let productId = $(this).data('product-id');
            $.ajax({
                url: `/Reckoning/DeleteMenuProduct/${productId}`,
                type: 'PUT',
                success: function (response) {

                    fetchMenuProducts();
                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
        }
        catch (e) {
            console.error(e);
        }
       
        
    });

    // Initial load of products
    fetchMenuProducts();
});
