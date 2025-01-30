using Barcode_Restaurant.Models;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;
using System.Drawing;
using System.Drawing.Printing;
using System.Reflection.Metadata;
using static System.Net.Mime.MediaTypeNames;
using System.Web.UI.WebControls;
using System.Runtime.InteropServices;
using Microsoft.Ajax.Utilities;
using System.Net.Http;
using System.Threading.Tasks;
using System.Net;




namespace Barcode_Restaurant.Controllers
{
    public class ReckoningController : Controller
    {

        private readonly BarcodeRestoEntities _context;
        
        public ReckoningController()
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



        private bool IsRemainingResto()
        {
            try
            {

                var user = GetUser();
                if (user == null)
                {
                    return false;
                }

                var restoPacket = _context.Packets.FirstOrDefault(p => p.UserId == user.UserId && p.PacketType == 1);
                if (restoPacket == null)
                {
                    return false;
                }

                TimeSpan remainingRestoUsageTime = restoPacket.RemainingUsageTime - DateTime.Now;
                double remainingRestoSeconds = remainingRestoUsageTime.TotalSeconds;
                double remainingRestoDays = remainingRestoUsageTime.TotalDays;
                if (remainingRestoDays <= 5)
                {
                    if (remainingRestoSeconds  < 1)
                    {

                    return false;
                    }
                    else
                    {
                        int remainingDays = (int)Math.Ceiling(remainingRestoDays);
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
        



        public ActionResult GetTables()
        {
           
           try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();
                var products = _context.Tables
                 .Where(t => t.UserId == user.UserId && (t.Status == 0 || t.Status == 1))
                 .Select(t => new
                 {
                     t.TableId,
                     t.TableCategorieId,
                     t.Orders,
                     t.OrderDate,
                     t.TableName,
                     t.Status
                    
                     
                 })
                 .ToList();

                var notifications = _context.Notifications
                    .Where(n => n.UserId == user.UserId)
                    .Select(n => new
                    {
                        n.NotificationId,
                        n.UserId,
                        n.WaiterId,
                        n.TableId,
                        n.TableName,
                        n.Orders,
                        n.OrderDate,

                    });
                var waiters = _context.Waiters
                    .Where(n => n.UserId == user.UserId)
                    .Select(n => new
                    {
                        n.WaiterId,
                        n.NameSurname

                    });
                var result = new
                {
                    tables = products,
                    Notifications = notifications,
                    Waiters = waiters
                };
                return Json(result, JsonRequestBehavior.AllowGet);

            }
            catch (Exception ex)
            {
                return View("Tables");
            }
        }
        


        [HttpPost]
        public ActionResult AddCategorieReq(string name, HttpPostedFileBase file)
        {
            try
            {
                int maxContentLength = 1 * 1024 * 1024;
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png"};
                var fileExtension = Path.GetExtension(file.FileName).ToLower();
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                if (file != null && file.ContentLength > maxContentLength)
                {
                    TempData["ErrorMessage"] = "Maksimum dosya boyutu 1 mb olmalıdır.";
                    return RedirectToAction("Menu", "Reckoning");
                }
                if (file != null && !allowedExtensions.Contains(fileExtension))
                {
                    TempData["ErrorMessage"] = "Geçersiz dosya türü. Yalnızca .jpg, .jpeg ve .png dosyaları yükleyebilirsiniz.";
                    return RedirectToAction("Menu", "Reckoning");
                }

                var user = GetUser();


                if (file == null || file.ContentLength == 0)
                {
                    TempData["ErrorMessage"] = "Dosya yüklenemedi.";
                    return RedirectToAction("Menu", "Reckoning");
                }
               

                string randomFileName = Path.GetRandomFileName();
                randomFileName = randomFileName.Replace(".", "");

                randomFileName = randomFileName.Substring(0, 8);


                string fileName = randomFileName + Path.GetExtension(file.FileName);


                string filePath = Path.Combine(Server.MapPath("~/Content/Assets/Images/ReckoningMenu/"), fileName);
                file.SaveAs(filePath);
                var menuCategorie = new MenuCategories
                {
                    UserId = user.UserId,
                    CategoryName = name,
                    CategoryImg = "/Content/Assets/Images/ReckoningMenu/" + fileName,
                    IsActive = 1
                };

                _context.MenuCategories.Add(menuCategorie);
                _context.SaveChanges();
                return RedirectToAction("Menu", "Reckoning");

            }
            catch (Exception ex)
            {
                
                return RedirectToAction("Menu", "Reckoning");
            }
        }

        [HttpPost]
        public ActionResult AddMenuProductReq(FormCollection form)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();

                var newProduct = new MenuProducts
                {
                    CategoryId = int.Parse(form["CategoryId"]),
                    UserId = user.UserId,
                    ProductName = form["ProductName"],
                    ProductPrice = form["ProductPrice"],
  
                    Status = 1
                };

                _context.MenuProducts.Add(newProduct);
                _context.SaveChanges();

                return RedirectToAction("Menu", "Reckoning");
            }
            catch (Exception ex)
            {
                return RedirectToAction("Menu", "Reckoning");
            }
        }




        public ActionResult GetMenuProducts(int? id )
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                if (id == null)
                {
                    return RedirectToAction("Menu", "Reckoning");
                }
                var user = GetUser();
                var menuProducts = _context.MenuProducts
                    .Where(p => p.UserId == user.UserId && p.CategoryId == id && p.Status == 1)
                    .Select(p => new
                    {
                        p.ProductId,
                        p.ProductName,
                       
                        p.ProductPrice,
                      
                        p.Status,
                       
                    }).ToList();
                return Json(menuProducts, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                
                System.Diagnostics.Debug.WriteLine($"GetProducts Error: {ex.Message}");
                return RedirectToAction("Menu", "Reckoning");
            }
        }
        public ActionResult GetSingleMenuProduct(int? id)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                if (id == null)
                {
                    return RedirectToAction("Menu", "Reckoning");
                }
                var user = GetUser();
                var menuProducts = _context.MenuProducts
                    .Where(p => p.UserId == user.UserId && p.ProductId == id && p.Status == 1)
                    .Select(p => new
                    {
                        p.ProductId,
                        p.ProductName,
                       
                        p.ProductPrice,
                      
                        p.Status,

                    }).ToList();
                return Json(menuProducts, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {

                System.Diagnostics.Debug.WriteLine($"GetProducts Error: {ex.Message}");
                return RedirectToAction("Menu", "Reckoning");
            }
        }

        public ActionResult GetAllMenuProductsToUser()
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();
                var menuProducts = _context.MenuProducts
                .Where(p => p.UserId == user.UserId && p.Status == 1)
                .Select(p => new
                {
                 
                    p.ProductId,
                    p.CategoryId,
                    p.ProductName,
                    
                    p.ProductPrice,
                   
                }).ToList();
                return Json(menuProducts, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {

               
                return RedirectToAction("Menu", "Reckoning");
            }
        }

        [HttpPut]
        public ActionResult DeleteMenuProduct(int? id)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

               

                var user = GetUser();
                var product = _context.MenuProducts.FirstOrDefault(p => p.ProductId == id && p.UserId == user.UserId);
                if (product == null || id == null)
                {
                    return RedirectToAction("Menu", "Reckoning");
                }

                product.Status = 0;
                _context.SaveChanges();

                return RedirectToAction("Menu", "Reckoning");
            }
            catch (Exception ex)
            {
                return RedirectToAction("Menu", "Reckoning");
            }
        }




        [HttpPut]
        public ActionResult DeleteMenuCategorie(int? id)
        {
            try
            {

                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                if (id == null)
                {
                    return RedirectToAction("Menu", "Reckoning");
                }


                var user = GetUser();

                var categorie = _context.MenuCategories.FirstOrDefault(c => c.CategoryId == id && c.UserId == user.UserId);
                if (categorie == null)
                {
                    return RedirectToAction("Menu", "Reckoning");
                }


                string filePath = Server.MapPath(categorie.CategoryImg);
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
                categorie.IsActive = 0;
                _context.SaveChanges();

                return RedirectToAction("Menu", "Reckoning");

            }
            catch (Exception ex)
            {
                return RedirectToAction("Menu", "Reckoning");
            }
        }


        [HttpPut]
        public ActionResult UpdateMenuProduct(int? id, MenuProducts updatedProduct)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();
                var product = _context.MenuProducts.FirstOrDefault(p => p.ProductId == id && p.UserId == user.UserId);
                if (product == null || id == null)
                {
                    return RedirectToAction("Menu", "Reckoning");
                }


                

                product.ProductName = updatedProduct.ProductName;
               
                product.ProductPrice = updatedProduct.ProductPrice;
                
               


                _context.SaveChanges();

                return RedirectToAction("Menu", "Reckoning");
            }
            catch (Exception ex)
            {
                return RedirectToAction("Menu", "Reckoning");
            }
        }

        public ActionResult Tables()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            var user = GetUser();
            ViewBag.UserName = user.Name;
            return View();
        }
        public ActionResult TableDetail(int? id)
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            var user = GetUser();
            var table = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableId == id);
            if (table == null || id == null)
            {
                return RedirectToAction("Tables", "Reckoning");
            }

            ViewBag.MenuCategories = _context.MenuCategories.Where(c => c.UserId == user.UserId && c.IsActive == 1).ToList();
            ViewBag.UserName = user.Name;

            return View(table);
        }


        public ActionResult Menu()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            var user = GetUser();
            ViewBag.MenuCategories = _context.MenuCategories.Where(MenuCategories => MenuCategories.UserId == user.UserId && MenuCategories.IsActive == 1).ToList();


            return View();
        }


        public ActionResult MenuCategories(int? id)
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            var user = GetUser();
            var menuCategorie = _context.MenuCategories.FirstOrDefault(c => c.CategoryId == id &&c.UserId == user.UserId && c.IsActive == 1);
            if (menuCategorie == null || id == null)
            {
                return RedirectToAction("Menu", "Reckoning");
            }
            



            return View(menuCategorie);
        }

        public ActionResult EditMenuProduct(int? id)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

              
                var user = GetUser();

                

                var product = _context.MenuProducts.FirstOrDefault(p => p.ProductId == id && p.UserId == user.UserId && p.Status == 1);
                if (id == null || product == null)
                {
                    return RedirectToAction("Menu", "Reckoning");
                }
                
                return View(product);


            }
            catch (Exception ex)
            {

                return RedirectToAction("Menu", "Reckoning");
            }
        }



        [HttpPut]
        public ActionResult MakeActiveThisTable(int? id, Tables updatedTable)
        {

            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();
                var table = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableId == id );
                if (table == null || id == null)
                {
                    return RedirectToAction("Tables", "Reckoning");
                }

                
                    table.Status = 1;
                    table.Orders = updatedTable.Orders;
                    table.OrderDate = DateTime.Now;
                
                

                _context.SaveChanges();

                return RedirectToAction("Tables", "Reckoning");
            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Reckoning");
            }

        }




        [HttpPut]
        public ActionResult MakeDeActiveThisTable(int? id)
        {

            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();
                var table = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableId == id);

                if (table == null || id == null)
                {
                    return RedirectToAction("Tables", "Reckoning");
                }

               
                    table.Status = 0;
                    table.Orders = null;
                    table.OrderDate = null;
                    _context.SaveChanges();
               
                return RedirectToAction("Tables", "Reckoning");
            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Reckoning");
            }

        }

        [HttpPut]

        public ActionResult ChangeTables(int? id, int? changeTableId)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();
                var table = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableId == id);
                var changeTable = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableId == changeTableId);

                if (table == null || id == null || changeTable == null || changeTableId == null)
                {
                    return RedirectToAction("Tables", "Reckoning");
                }
                var orders = table.Orders;
                var orderDate = table.OrderDate;

                MakeDeActiveThisTable(id);

                changeTable.Orders = orders;
                changeTable.OrderDate = orderDate;
                changeTable.Status = 1;

                _context.SaveChanges();
                return RedirectToAction("Tables", "Reckoning");

            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Reckoning");
            }
        }




        [HttpPost]
        public ActionResult AddTableSalesHistory(FormCollection form)
        {
            try
            {

                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();


               

                var history = new TableSalesHistory
                {
                    UserId = user.UserId,
                    TableId = int.Parse(form["TableId"]),
                    TableName = form["TableName"],
                    Orders = form["Orders"],
                    OrderClosingDate = DateTime.Now,
                    OrderStartingDate = DateTime.Parse(form["OrderStartingDate"]),
                    PaymentCash = form["PaymentCash"],
                    PaymentCard = form["PaymentCard"],
                    PaymentDiscount = form["PaymentDiscount"]

                };
                
               
                _context.TableSalesHistory.Add(history);
                _context.SaveChanges();
                MakeDeActiveThisTable(int.Parse(form["TableId"]));
                return RedirectToAction("Menu", "Reckoning");
            }
            catch (Exception ex)
            {
                return RedirectToAction("Menu", "Reckoning");
            }
        }








        [HttpPost]
        public JsonResult AddTableReq(string tableName, string tableCategoryId)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return Json(new { success = false, message = "Lütfen giriş yapın." });
                }
                if (!IsRemainingResto())
                {
                    return Json(new { success = false, message = "Lütfen paket satın alın." });
                }

                var user = GetUser();
                int parsedTableCategoryId;
                if (!Int32.TryParse(tableCategoryId, out parsedTableCategoryId))
                {
                    return Json(new { success = false, message = "Geçersiz masa kategorisi!" });
                }
                var findedTable = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableName == tableName && (t.Status == 1 || t.Status == 0) && t.TableCategorieId == parsedTableCategoryId);
                if (findedTable != null)
                {
                    return Json(new { success = false, message = "Bu isimde bir masa zaten mevcut!" });
                }

                var table = new Tables
                {
                    UserId = user.UserId,
                    TableName = tableName,
                    TableCategorieId = parsedTableCategoryId,
                    Status = 0,
                };
                _context.Tables.Add(table);
                _context.SaveChanges();

                return Json(new { success = true, message = "Masa başarıyla eklendi." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Sunucu tarafında bir hata ile karşılaşıldı!" });
            }
        }

        public ActionResult AddTable()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            return View();
        }



        [HttpPost]
        public ActionResult EditTableReq(int tableId, string tableName, string tableCategoryId)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();

                // Parse the tableCategoryId before the query
                int parsedTableCategoryId;
                if (!Int32.TryParse(tableCategoryId, out parsedTableCategoryId))
                {
                    ViewBag.Message = "Geçersiz masa kategorisi!";
                    return RedirectToAction("Tables", "Reckoning");
                }

                // Use the parsed integer in the LINQ query
                var findedTable = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableName == tableName && (t.Status == 1 || t.Status == 0) && t.TableCategorieId == parsedTableCategoryId);
                if (findedTable != null)
                {
                    ViewBag.Message = "Bu isimde bir masa zaten mevcut!";
                    return View("EditTable", findedTable);
                }

                var table = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableId == tableId);

                if (table == null)
                {
                    return View("EditTable", table);
                }

                table.TableName = tableName;
                table.TableCategorieId = parsedTableCategoryId;

                _context.SaveChanges();

                ViewBag.Message = "Masa  başarıyla güncellendi!";
                return View("EditTable", table);

            }
            catch (Exception ex)
            {
                var user = GetUser();
                ViewBag.Message = "Sunucu tarafında bir hata ile karşılaşıldı: ";
                var table = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableId == tableId);
                return View("EditTable", table);
            }
        }

        public ActionResult EditTable(int? id)
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            var user = GetUser();
            var table = _context.Tables.FirstOrDefault(t =>t.UserId == user.UserId && t.TableId == id);
            
            if (table == null || id == null)
            {
                return RedirectToAction("Tables", "Reckoning");
            }
            return View(table);
        }
        [HttpPut]
        public ActionResult DeleteTable(FormCollection form)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();
                int tableId = int.Parse(form["TableId"]);

                var table = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableId == tableId);
                if (table == null)
                {
                    return RedirectToAction("Tables", "Reckoning");
                }


                table.Status = 2;
                table.Orders = null;
                table.OrderDate = null;
               
                _context.SaveChanges();

                return RedirectToAction("Tables", "Reckoning");



            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Reckoning");
            }

        }


        [HttpPut]

        public ActionResult ConcatTables(FormCollection form)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();
                int currentTableId = int.Parse(form["CurrentTableId"]);
                int selectedTableId = int.Parse(form["SelectedTableId"]);

                string concatOrders = form["ConcatOrders"];

                var currentTable = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableId == currentTableId);
                var selectedTable = _context.Tables.FirstOrDefault(t => t.UserId == user.UserId && t.TableId == selectedTableId);

                if (currentTable == null || selectedTable == null)
                {
                    return RedirectToAction("Tables", "Reckoning");
                }

                currentTable.Status = 0;
                currentTable.Orders = null;
                currentTable.OrderDate = null;

                selectedTable.Status = 1;
                selectedTable.Orders = concatOrders;


                _context.SaveChanges();





                return RedirectToAction("Tables", "Reckoning");

            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Reckoning");
            }
        }



        [HttpPost]
        public ActionResult AddTableCategorieReq(string categoryName)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();

                var findedCatgorie = _context.TableCategories.FirstOrDefault(c => c.UserId == user.UserId && c.TableCategorieName == categoryName && c.IsActive == 1);
                if (findedCatgorie != null)
                {
                    ViewBag.Message = "Bu isimde bir kategori zaten mevcut!";
                    return View("AddTableCategories");
                }

                var categories = new TableCategories
                {
                    UserId = user.UserId,
                    TableCategorieName = categoryName,
                    IsActive = 1
                };

                _context.TableCategories.Add(categories);
                _context.SaveChanges();

                ViewBag.Message = "Masa Kategorisi başarıyla eklendi.";
                return View("AddTableCategories");
            }
            catch (Exception ex)
            {

                ViewBag.Message = "Kategori eklenirken bir hata oluştu!";
                return View("AddTableCategories");
            }
        }

        public ActionResult AddTableCategories()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            return View();
        }


        public ActionResult TableCategories()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            var user = GetUser();
            var tableCategories = _context.TableCategories.Where(c => c.UserId == user.UserId && c.IsActive == 1).ToList();

            return View(tableCategories);
        }



        [HttpPost]
        public ActionResult EditTableCategoriesReq(int tableCategorieId, string tableCategorieName)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();

                var findedTableCategorie = _context.TableCategories.FirstOrDefault(t => t.UserId == user.UserId && t.TableCategorieName == tableCategorieName);
                if (findedTableCategorie != null)
                {
                    ViewBag.Message = "Bu isimde bir masa zaten mevcut!";
                    return View("EditTableCategories", findedTableCategorie);
                }


                var tableCategorie = _context.TableCategories.FirstOrDefault(t => t.UserId == user.UserId && t.TableCategorieId == tableCategorieId);

                if (tableCategorie == null)
                {
                    return View("EditTableCategories", tableCategorie);
                }
                tableCategorie.TableCategorieName = tableCategorieName;

                _context.SaveChanges();

                ViewBag.Message = "Masa adı başarıyla güncellendi!";
                return View("EditTableCategories", tableCategorie);

            }
            catch (Exception ex)
            {
                var user = GetUser();
                ViewBag.Message = "Sunucu tarafında bir hata ile karşılaşıldı!" + ex;
                var tableCategorie = _context.TableCategories.FirstOrDefault(t => t.UserId == user.UserId && t.TableCategorieId == tableCategorieId);
                return View("EditTableCategories", tableCategorie);
            }
        }

        public ActionResult EditTableCategories(int? id)
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            var user = GetUser();
            var tableCategorie = _context.TableCategories.FirstOrDefault(c => c.UserId == user.UserId && c.TableCategorieId == id);

            if (tableCategorie == null || id == null)
            {
                return RedirectToAction("TableCategories", "Reckoning");
            }

            return View(tableCategorie);
        }

        [HttpPut]
        public ActionResult DeleteTableCategories(FormCollection form)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                int tableCategorieId = int.Parse(form["tableCategorieId"]);

                var user = GetUser();

                var tableCategorie = _context.TableCategories.FirstOrDefault(t => t.UserId == user.UserId && t.TableCategorieId == tableCategorieId);

                if (tableCategorie == null)
                {
                    return RedirectToAction("TableCategories", "Reckoning");
                }

                var tables = _context.Tables.Where(t => t.TableCategorieId == tableCategorieId).ToList();
                foreach (var table in tables)
                {
                    table.Status = 2;
                    table.Orders = null;
                    table.OrderDate = null;
                    _context.SaveChanges();
                }

                tableCategorie.IsActive = 0;

                _context.SaveChanges();
                return RedirectToAction("TableCategories", "Reckoning");
            }
            catch (Exception ex)
            {
                return RedirectToAction("TableCategories", "Reckoning");
            }
        }

        [HttpGet]
        public ActionResult GetTableCategories()
        {

            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();
                var categories = _context.TableCategories
                 .Where(t => t.UserId == user.UserId && t.IsActive == 1 )
                 .Select(t => new
                 {
                     t.TableCategorieId,
                     t.TableCategorieName,

                 })
                 .ToList();
                return Json(categories, JsonRequestBehavior.AllowGet);

            }
            catch (Exception ex)
            {
                return View("Tables");
            }
        }

        [HttpDelete]
        public ActionResult DeleteNotification(int? id)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();
                var notification = _context.Notifications.FirstOrDefault(n => n.NotificationId == id && n.UserId == user.UserId);
                if (notification == null || id == null)
                {
                    return RedirectToAction("Tables", "Reckoning");
                }
                _context.Notifications.Remove(notification);
                _context.SaveChanges();

                return RedirectToAction("Tables", "Reckoning");

            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Reckoning");
            }
        }
        [HttpDelete]
        public ActionResult DeleteAllNotifications(int? id)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var user = GetUser();

                
                var notifications = _context.Notifications.Where(n => n.UserId == id).ToList();

                if (notifications == null || !notifications.Any())
                {
                    return RedirectToAction("Tables", "Reckoning");
                }

              
                _context.Notifications.RemoveRange(notifications);
                _context.SaveChanges();

                return RedirectToAction("Tables", "Reckoning");
            }
            catch (Exception ex)
            {
                // Hata durumunda Tables sayfasına yönlendir
                return RedirectToAction("Tables", "Reckoning");
            }
        }



    }





}