$(document).ready(function () {
    var allProducts = [];
    var groupedProducts = [];
    var filteredProducts = []; 
    var currentPage = 1;
    var productsPerPage = 10;
    var maxVisiblePages = 7;

    try {
        showPreloader('flex')
        $.ajax({
            url: '/Barcode/GetDailyReport',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                allProducts = response.reverse();
                groupProductsByDate(); // Sayfa yüklendiğinde tüm ürünler gruplanır
                filteredProducts = groupedProducts.slice(); // Filtrelenmiş ürünleri tüm ürünlerle başlat
                
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

    

    const groupProductsByDate = () => {
        try {
            groupedProducts = [];
            allProducts.forEach(product => {
                const dateString = product.Date;
                const timestamp = parseInt(dateString.substr(6));
                const productDate = new Date(timestamp);
                const formattedDate = `${productDate.getDate()}.${productDate.getMonth() + 1}.${productDate.getFullYear()}`;
                const existingGroupIndex = groupedProducts.findIndex(group => group.date === formattedDate);
                if (existingGroupIndex !== -1) {
                    groupedProducts[existingGroupIndex].totalCost += parseFloat(product.TotalCost);
                    groupedProducts[existingGroupIndex].cardPaid += parseFloat(product.CardPaid);
                    groupedProducts[existingGroupIndex].cashPaid += parseFloat(product.CashPaid);
                } else {
                    groupedProducts.push({
                        date: formattedDate,
                        totalCost: parseFloat(product.TotalCost),
                        cardPaid: parseFloat(product.CardPaid),
                        cashPaid: parseFloat(product.CashPaid)
                    });
                }
            });
        }
        catch (e) {
            console.error(e);
        }


        
    };

    const showProducts = (page) => {
        try {
            $(".tableBody").empty();
            const startIndex = (page - 1) * productsPerPage;
            const endIndex = startIndex + productsPerPage;
            const productsToShow = filteredProducts.slice(startIndex, endIndex); // Filtrelenmiş ürünleri göster
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
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage); // Filtrelenmiş ürün sayısına göre sayfa sayısını hesapla
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
            $(this).addClass("active");
        }
        catch (e) {
            console.error(e);
        }


       
    });

    const filterByDate = (selectedDate) => {
        try {
            const selectedDateTime = new Date(selectedDate);
            filteredProducts = groupedProducts.filter(group => {
                const dateStringParts = group.date.split('.'); // Tarihi parçalara ayırıyoruz
                const groupDate = new Date(dateStringParts[2], dateStringParts[1] - 1, dateStringParts[0]); // Yıl, ay ve gün sırasıyla

                // Seçilen tarih ile grup tarihi karşılaştırması yapılıyor
                return selectedDateTime.toDateString() === groupDate.toDateString();
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
                filteredProducts = groupedProducts.slice(); // Filtre kaldırıldığında tüm ürünleri göster
                showProducts(currentPage);
            }
        }
        catch (e) {
            console.error(e);
        }

        
    });

    const showTr = (products) => {
        try {
            for (var i = 0; i < products.length; i++) {
                var product = products[i];
                var productHTML = `
                <tr>
                    <td>${product.date}</td>
                    <td>${parseFloat(product.totalCost).toFixed(2)}TL</td>
                    <td>${parseFloat(product.cardPaid).toFixed(2)}TL</td>
                    <td>${parseFloat(product.cashPaid).toFixed(2)}TL</td>
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
