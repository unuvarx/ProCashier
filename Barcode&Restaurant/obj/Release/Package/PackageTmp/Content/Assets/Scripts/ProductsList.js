$(document).ready(function () {

    var allProducts = [];
    var filteredProducts = [];
    var currentPage = 1;
    var productsPerPage = 50;
    var maxVisiblePages = 7;

    // Ürünleri yükleme işlemi
    try {
        $.ajax({
            url: '/Barcode/GetProducts',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                response.reverse();
                allProducts = response;
                filteredProducts = allProducts;
                showProducts(currentPage);
                renderPagination();
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }
    catch (e) {
        console.error(e);
    }

    // Ürünleri gösterme işlemi
    const showProducts = (page) => {
        try {
            $(".tableBody").empty();
            const startIndex = (page - 1) * productsPerPage;
            const endIndex = startIndex + productsPerPage;
            const productsToShow = filteredProducts.slice(startIndex, endIndex);
            showTr(productsToShow);
            renderPagination();
        }
        catch (e) {
            console.error(e);
        }
    };

    // Sayfalama işlemi
    const renderPagination = () => {
        try {
            $(".pagination-list").empty();
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

            let startPage, endPage;

            if (totalPages <= maxVisiblePages) {
                startPage = 1;
                endPage = totalPages;
            } else {
                const halfMaxVisiblePages = Math.floor(maxVisiblePages / 2);
                if (currentPage <= halfMaxVisiblePages) {
                    startPage = 1;
                    endPage = maxVisiblePages;
                } else if (currentPage + halfMaxVisiblePages >= totalPages) {
                    startPage = totalPages - maxVisiblePages + 1;
                    endPage = totalPages;
                } else {
                    startPage = currentPage - halfMaxVisiblePages;
                    endPage = currentPage + halfMaxVisiblePages;
                }
            }

            if (startPage > 1) {
                $(".pagination-list").append(`<li><a href="#" class="page-link">1</a></li>`);
                if (startPage > 2) {
                    $(".pagination-list").append(`<li><span>...</span></li>`);
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                if (i === 1) {
                    $(".pagination-list").append(`<li><a href="#" class="page-link active">${i}</a></li>`);
                } else {
                    $(".pagination-list").append(`<li><a href="#" class="page-link">${i}</a></li>`);
                }
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    $(".pagination-list").append(`<li><span>...</span></li>`);
                }
                $(".pagination-list").append(`<li><a href="#" class="page-link">${totalPages}</a></li>`);
            }
        }
        catch (e) {
            console.error(e);
        }
    };

    // Sayfa değişikliği için event listener
    $(document).on("click", ".page-link", function (e) {
        try {
            e.preventDefault();
            currentPage = parseInt($(this).text());
            showProducts(currentPage);

            $(".page-link").removeClass("active");

            $(".page-link").each(function () {
                if (parseInt($(this).text()) === currentPage) {
                    $(this).addClass("active");
                }
            });
        }
        catch (e) {
            console.error(e);
        }
    });

    // Arama kutusu için event listener
    $('input[name="search"]').on('keyup', function () {
        try {
            const searchTerm = $(this).val().trim().toLowerCase();

            if (searchTerm === "") {
                filteredProducts = allProducts;
            } else {
                filteredProducts = allProducts.filter(product =>
                    product.Barcode.toLowerCase().startsWith(searchTerm)
                );
            }

            currentPage = 1; // Sayfalamanın ilk sayfadan başlaması için
            showProducts(currentPage);
        }
        catch (e) {
            console.error(e);
        }
    });

    // Ürün satırlarını gösterme
    const showTr = (products) => {
        try {
            for (var i = products.length - 1; i >= 0; i--) {
                var product = products[i];
                var productHTML = `
                <tr> 
                    <td>${product.Barcode}</td> 
                    <td>${product.Name}</td> 
                    <td>${parseFloat(product.Price).toFixed(2)}TL</td> 
                    <td><a href="/Barcode/ProductEdit/${product.ProductId}" class="btn btn-success">Düzenle</a></td>
                    <td>
                    <form action="/Barcode/DeleteProduct" method="post">
                    <input type="hidden" name="id" value="${product.ProductId}" /> 
                    <button type="submit" class="btn btn-danger">Sil</button> 
                    </form> 
                    </td> 
                 </tr>
            `;
                $(".tableBody").append(productHTML);
            }
        }
        catch (e) {
            console.error(e);
        }
    };

    // Silme işlemi için onay alma
    $(document).on('submit', 'form[action="/Barcode/DeleteProduct"]', function (e) {
        try {
            if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
                e.preventDefault();
            }
        }
        catch (e) {
            console.error(e);
        }
    });
});
