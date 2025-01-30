$(document).ready(function () {

    var allProducts = [];
    var filteredProducts = [];
    var currentPage = 1;
    var productsPerPage = 10; 
    var maxVisiblePages = 7; 

    try {
        showPreloader('flex')
        $.ajax({
            url: '/Barcode/GetSalesHistory',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
               
                allProducts = response;
                filteredProducts = allProducts;
                showProducts(currentPage);
                renderPagination();
                showPreloader('none')
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }
    catch (e) {
        console.error(e);
    }
    
    
    
   
    
  
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

  
    const filterByDate = (selectedDate) => {
        try {
            const selectedDateTime = new Date(selectedDate);
            filteredProducts = allProducts.filter(product => {
                const dateString = product.Date;
                const timestamp = parseInt(dateString.substr(6));
                const productDate = new Date(timestamp);


                return selectedDateTime.getDate() === productDate.getDate() &&
                    selectedDateTime.getMonth() === productDate.getMonth() &&
                    selectedDateTime.getFullYear() === productDate.getFullYear();
            });

            currentPage = 1;
            showProducts(currentPage);
        }
        catch (e) {
            console.error(e);
        }
        
    };

    
    $('input[name="date"]').on('change', function () {
        try {
            const selectedDate = $(this).val();
            if (selectedDate) {
                filterByDate(selectedDate);
            } else {
                filteredProducts = allProducts;
                showProducts(currentPage);
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });

    
    const showTr = (products) => {
        try {
            for (var i = products.length - 1; i >= 0; i--) {
                var product = products[i];
                var dateString = product.Date;
                var timestamp = parseInt(dateString.substr(6));
                var date = new Date(timestamp);
                var formattedDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;

                var productHTML = `
                <tr>
                    <td><a class="detailBtn " target="blank"  href="/Barcode/SalesHistoryDetail/${product.SalesHistoryId}">Detay</a></td>
                    <td>${JSON.parse(product.Products).length}</td>
                    <td>${parseFloat(product.TotalCost).toFixed(2)}TL</td>
                    <td>${parseFloat(product.CardPaid).toFixed(2)}TL</td>
                    <td>${parseFloat(product.CashPaid).toFixed(2)}TL</td>
                    <td>${formattedDate}</td>
                </tr>
            `;
                $(".tableBody").append(productHTML);
            }
        }
        catch (e) {
            console.error(e);
        }
        
    };
    function showPreloader(display) {
        try {

            $('.preloader').css('display', display);

        }
        catch (e) {
            console.error(e);
        }
    }
});
