using Barcode_Restaurant.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;
using Newtonsoft.Json;
using Microsoft.Ajax.Utilities;
using System.Net;
using System.Drawing.Printing;
using System.Drawing;

namespace Barcode_Restaurant.Controllers
{
    public class BarcodeController : Controller
    {
        
        private readonly BarcodeRestoEntities _context;

        public BarcodeController()
        {
            _context = new BarcodeRestoEntities();
        }
        
        private Users ValidateToken(string token)
        {
            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ConfigurationManager.AppSettings["SecretKey"]));
            var tokenHandler = new JwtSecurityTokenHandler();

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = secretKey,
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var username = jwtToken.Subject;

            var user = _context.Users.FirstOrDefault(u => u.Username == username);
            return user;
        }
        private bool UserIsAuthenticated()
        {
            try
            {
                string token = Request.Cookies["_u"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return false;
                }

                var user = ValidateToken(token);

                if (user == null)
                {
                    return false;
                }
                if (user.Status == 0)
                {
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {

                return false;
            }
        }
        private Users GetUser()
        {
            try
            {
                string token = Request.Cookies["_u"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return null;
                }

                var user = ValidateToken(token);

                return user;
            }
            catch (Exception ex)
            {

                return null;
            }
        }


        private bool IsRemainingBarcode()
        {
            try
            {
                
                var user = GetUser();
                if (user == null)
                {
                    return false;
                }

                var barcodePacket = _context.Packets.FirstOrDefault(p => p.UserId == user.UserId && p.PacketType == 0);
                if (barcodePacket == null)
                {
                    return false;
                }

                TimeSpan remainingBarcodeUsageTime = barcodePacket.RemainingUsageTime - DateTime.Now;
                double remainingBarcodeSeconds = remainingBarcodeUsageTime.TotalSeconds;
                double remainingBarcodeDays = remainingBarcodeUsageTime.TotalDays;

                if (remainingBarcodeDays <= 5)
                {
                    if (remainingBarcodeSeconds < 1)
                    {
                    return false;

                    }
                    else
                    {
                        int remainingDays = (int)Math.Ceiling(remainingBarcodeDays);
                        ViewBag.WarningMessage = $"Kullanım sürenizin bitmesine {remainingDays} gün kalmıştır. ";
                        return true;
                    }
                }
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
        public ActionResult Selling()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingBarcode())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            var user = GetUser();

            ViewBag.UserName = user.Name;
            var products = _context.BarcodeProducts.Where(p => p.UserId == user.UserId && p.isActive == 1).ToList();

            return View(products);
           
        }

       
        public ActionResult GetProducts()
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingBarcode())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();


                var products = _context.BarcodeProducts
                 .Where(p => p.UserId == user.UserId && p.isActive == 1)
                 .Select(p => new
                 {
                     p.ProductId,
                     p.Barcode,
                     p.Name,
                     p.Price,
                     Amount = 1,
                     Cost = p.Price,
                     IsUpdate = false,
                     NewPrice = p.Price,

                 })
                 .ToList();
                return Json(products, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
               return View("Selling");
            }
        }
        public ActionResult GetDailyReport()
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingBarcode())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();

                var packet = _context.Packets.FirstOrDefault(p => p.UserId == user.UserId && p.PacketType == 0);
                if (packet == null)
                {
                    return Json(new { success = false, message = "Packet not found for the user." }, JsonRequestBehavior.AllowGet);
                }
                

                var salesHistory = _context.SalesHistory
                 
                 .Select(p => new
                 {
                     p.TotalCost,
                     p.Products,
                     p.Date,
                     p.SalesHistoryId,
                     p.CardPaid,
                     p.CashPaid
                 })
                 .ToList();
                return Json(salesHistory, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                // Hata ayıklama mesajı
                System.Diagnostics.Debug.WriteLine($"GetProducts Error: {ex.Message}");
                return View("SalesHistory");
            }
        }
        public ActionResult GetSalesHistory()
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingBarcode())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();


                var salesHistory = _context.SalesHistory
                 .Where(p => p.UserId == user.UserId)
                 .Select(p => new
                 {
                     p.TotalCost,
                     p.Products,
                     p.Date,
                     p.SalesHistoryId,
                     p.CardPaid,
                     p.CashPaid,
                 })
                 .ToList();
                return Json(salesHistory, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                // Hata ayıklama mesajı
                System.Diagnostics.Debug.WriteLine($"GetProducts Error: {ex.Message}");
                return View("SalesHistory");
            }
        }
        public ActionResult AddProduct()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingBarcode())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            return View();
        }


        public ActionResult ProductsList()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingBarcode())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            var user = GetUser();

           
            var products = _context.BarcodeProducts.Where(p => p.UserId == user.UserId && p.isActive == 1).ToList();
            
            return View(products);
        }



        public ActionResult SalesHistory()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingBarcode())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            return View();
        }


        public ActionResult DailyTurnover()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingBarcode())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            return View();
        }
        public ActionResult GetSalesHistoryById(int id)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingBarcode())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();

                var salesHistory = _context.SalesHistory
                    .FirstOrDefault(p => p.UserId == user.UserId && p.SalesHistoryId == id);

                if (salesHistory == null)
                {
                    return HttpNotFound(); 
                }

                var salesHistoryData = new
                {
                    salesHistory.TotalCost,
                    salesHistory.Products,
                    salesHistory.Date,
                    salesHistory.SalesHistoryId
                };

                return Json(salesHistoryData, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetSalesHistoryById Error: {ex.Message}");
                return new HttpStatusCodeResult(HttpStatusCode.InternalServerError);
            }
        }
        public ActionResult SalesHistoryDetail(int id)
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingBarcode())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            ViewBag.SalesHistoryId = id;

            return View();

        }


        [HttpPost]
        public ActionResult AddProductReq(string barcode, string name, string price)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingBarcode())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();
                var findedProduct = _context.BarcodeProducts.FirstOrDefault(p => p.Barcode == barcode && p.isActive == 1 && p.UserId == user.UserId);
                if (findedProduct != null)
                {
                    ViewBag.ErrorMessage = "Bu barkod numarası zaten kullanımda!";
                    return View("AddProduct");
                }

                var product = new BarcodeProducts
                {
                    UserId = user.UserId,
                    Barcode = barcode,
                    Name = name,
                    Price = price,
                    isActive = 1
                   
                };

                _context.BarcodeProducts.Add(product);
                _context.SaveChanges();

                ViewBag.SuccessMessage = "Ürün başarıyla eklendi.";
                return View("AddProduct");
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Ürün eklenirken bir hatayla karşılaşıldı!";
                return View("AddProduct");
            }
        }
        [HttpPost]
        public ActionResult AddProductReqFromSelling(string barcode, string name, string price)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingBarcode())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();
                var findedProduct = _context.BarcodeProducts.FirstOrDefault(p => p.Barcode == barcode && p.isActive == 1 && p.UserId == user.UserId);
                if (findedProduct != null)
                {
                    return Json(new { success = false, message = "Bu barkod numarası zaten kullanımda!" }, JsonRequestBehavior.AllowGet);
                }

                var product = new BarcodeProducts
                {
                    UserId = user.UserId,
                    Barcode = barcode,
                    Name = name,
                    Price = price,
                    isActive = 1
                };

                _context.BarcodeProducts.Add(product);
                _context.SaveChanges();

                return Json(new { success = true, message = "Ürün başarıyla eklendi." }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Ürün eklenirken bir hatayla karşılaşıldı!" }, JsonRequestBehavior.AllowGet);
            }
        }


        public class Product
        {
            
            public int ProductId { get; set; }
            public string Barcode { get; set; }
            public string Name { get; set; }
            public string Price { get; set; }
            public string NewPrice { get; set; }
            public int Amount { get; set; }
            public string Cost { get; set; }
            public bool IsUpdate { get; set; }
        }
        [HttpPost]
        public ActionResult CompleteTheSell(string totalCost, List<Product> products, string productsStr, string cashPaid, string cardPaid)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingBarcode())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();
                foreach (var item in products)
                {
                    if (!item.IsUpdate == false)
                    {
                        var product = _context.BarcodeProducts.FirstOrDefault(p => p.ProductId == item.ProductId && p.isActive == 1 && user.UserId == p.UserId);

                        if (product != null)
                        {
                            product.Price = item.NewPrice;
                        }
                    }
                }  
                SalesHistory history = new SalesHistory
                {
                    UserId = user.UserId,
                    TotalCost = totalCost,
                    Products = productsStr,
                    Date = DateTime.Now,
                    CashPaid = cashPaid,
                    CardPaid = cardPaid
                };
              

                _context.SalesHistory.Add(history);
                _context.SaveChanges();
                ViewBag.SuccessMessage = "Satış işlemi başarıyla tamamlandı.";
                return View("Selling");
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Satış işlemi sırasında bir hata ile karşılaşıldı!";
                return View("Selling");
            }
        }


        [HttpPost]
        public ActionResult DeleteProduct(int id)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingBarcode())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();
                var product = _context.BarcodeProducts.FirstOrDefault(p => p.ProductId == id && p.isActive == 1 && p.UserId == user.UserId);

                if (product == null)
                {
                    return RedirectToAction("ProductsList", "Barcode");
                }

                product.isActive = 0;
                _context.SaveChanges();

                var updatedProducts = _context.BarcodeProducts
                 .Where(p => p.UserId == user.UserId)
                 .ToList();
                return View("ProductsList", updatedProducts);
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Ürün silinirken bir hata oluştu!";
                
                return View("ProductsList");
            }
        }


        public ActionResult ProductEdit(int id)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingBarcode())
                {
                    return RedirectToAction("BuyPacket", "User");
                }


                var user = GetUser();
                var product = _context.BarcodeProducts.FirstOrDefault(p => p.ProductId == id && p.isActive == 1 && p.UserId == user.UserId);

                if (product == null)
                {

                    return RedirectToAction("ProductsList", "Barcode");
                }
                ViewBag.UpdateMessage = TempData["UpdateMessage"];
                ViewBag.Product = product;
                return View();
            }
            catch (Exception ex)
            {
                return RedirectToAction("ProductsList", "Barcode");
            }

        }
        [HttpPost]

        public ActionResult ProductUpdateReq(int id, string barcode, string name, string price)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingBarcode())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                 var user = GetUser();

                var product = _context.BarcodeProducts.FirstOrDefault(p => p.ProductId == id && p.isActive == 1 && p.UserId == user.UserId);
                 if (product == null)
                 {
                    return RedirectToAction("ProductsList", "Barcode");
                 }
                var findedProduct = _context.BarcodeProducts.FirstOrDefault(p => p.Barcode == barcode && p.isActive == 1 && p.ProductId != id && p.UserId == user.UserId);
                if (findedProduct != null)
                {
                    TempData["UpdateMessage"] = "Bu barkoda sahip bir ürün zaten var!";
                    return RedirectToAction($"ProductEdit/{id}", "Barcode");
                }
                product.Barcode = barcode;
                product.Name = name;
                product.Price = price;
                _context.SaveChanges();


                TempData["UpdateMessage"] = "Ürün başarıyla güncellendi.";


                return RedirectToAction($"ProductEdit/{id}", "Barcode");

            }
            catch (Exception ex)
            {
                TempData["UpdateMessage"] = "Ürün güncellenirken bir hata oluştu!";
                return RedirectToAction("ProductsList", "Barcode");
            }
        }







    }
}