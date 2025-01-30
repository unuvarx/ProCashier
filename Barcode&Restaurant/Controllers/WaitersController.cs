using Barcode_Restaurant.Models;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Drawing;
using System.Drawing.Printing;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace Barcode_Restaurant.Controllers
{
    public class WaitersController : Controller
    {
        private readonly BarcodeRestoEntities _context;

        public WaitersController()
        {
            _context = new BarcodeRestoEntities();
        }
        


        private Waiters ValidateTokenWaiter(string token)
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

            var waiter = _context.Waiters.FirstOrDefault(u => u.Username == username && u.Status == 1);

            return waiter;
        }
        private Users ValidateTokenUser(string token)
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

                var user = ValidateTokenUser(token);

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
        private bool WaiterIsAuthenticated()
        {
            try
            {
                string token = Request.Cookies["_w"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return false;
                }

                var waiter = ValidateTokenWaiter(token);

                if (waiter == null)
                {
                    return false;
                }
                if (waiter.Status == 0)
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

                var user = ValidateTokenUser(token);

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
                if (remainingRestoSeconds <= 1)
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
       

        [HttpPost]
        public ActionResult AddWaiterReq(string nameSurname, string username, string password)
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

                if (user == null)
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                var isUsernameExists = _context.Waiters.Any(c => c.Username == username && c.Status == 1);

                if (isUsernameExists)
                {
                    ViewBag.Message = "Bu kullanıcı adı zaten kullanılmaktadır!";
                }
                else
                {
                    var waiter = new Waiters
                    {
                        UserId = user.UserId,
                        NameSurname = nameSurname,
                        Username = username,
                        Password = password,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                        Status = 1
                        
                    
                    };

                    _context.Waiters.Add(waiter);
                    _context.SaveChanges();
                    return RedirectToAction("AllWaiters", "Waiters");
                   
                }

                return View("AddWaiter");
            }
            catch (Exception ex)
            {
                ViewBag.Message = "Kurye eklenirken bir hata ile karşılaşıldı!";
                return View("AddWaiter");
            }
        }

        
        public ActionResult AddWaiter()
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

        public ActionResult AllWaiters()
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
        public ActionResult UpdateWaiter(int? id)
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

            var waiter = _context.Waiters.FirstOrDefault(c => c.UserId == user.UserId && c.WaiterId == id && c.Status == 1);
            if (waiter == null || id == null)
            {
                return RedirectToAction("AllWaiters", "Waiters");
            }

            ViewBag.Waiter = waiter;

            return View();
        }
        [HttpPost]
        public ActionResult UpdateWaiterReq(string nameSurname, string username, string password, int id)
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

                var waiter = _context.Waiters.FirstOrDefault(c => c.UserId == user.UserId && c.WaiterId == id && c.Status == 1);
                if (waiter == null)
                {
                    return RedirectToAction("AllWaiters", "Waiters");
                }
                var findUsername = _context.Waiters.FirstOrDefault(c => c.Username == username && c.WaiterId != id);


                if (findUsername != null)
                {
                    ViewBag.Message = "Bu kullanıcı adı zaten kullanılmaktadır!";
                    return View("UpdateWaiter");
                }
                waiter.NameSurname = nameSurname;
                waiter.Username = username;
                waiter.Password = password;
                ViewBag.Waiter = waiter;
                _context.SaveChanges();
                return RedirectToAction("AllWaiters", "Waiters");
              
            }
            catch (Exception ex)
            {
                ViewBag.Message = "Garson güncellenirken bir hata oluştu!";
                return View("AllWaiters");
            }

        }





        [HttpPut]

        public ActionResult DeleteWaiter(int? id)
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

                var waiter = _context.Waiters.FirstOrDefault(c => c.UserId == user.UserId && c.WaiterId == id && c.Status == 1);
                if (waiter == null)
                {
                    return RedirectToAction("AllWaiters", "Waiters");
                }
                waiter.Status = 0;
                _context.SaveChanges();

                return RedirectToAction("AllWaiters", "Waiters");
            }
            catch (Exception ex)
            {

                return RedirectToAction("AllWaiters", "Waiters");
            }

        }
        public ActionResult GetWaiters()
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

                var waiters = _context.Waiters
                    .Where(c => c.UserId == user.UserId && c.Status == 1)
                    .Select(x => new
                    {
                        x.WaiterId,
                        x.Username,
                        x.Password,
                        x.NameSurname,

                    })
                    .ToList();


                return Json(waiters, JsonRequestBehavior.AllowGet);


            }
            catch (Exception ex)
            {

                return View("AllWaiters");
            }


        }
        // ---------------------------- WAITER PROCESS -------------------------------------
       
        private Waiters GetWaiter()
        {
            try
            {
                string token = Request.Cookies["_w"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return null;
                }

                var waiter = ValidateTokenWaiter(token);

                return waiter;
            }
            catch (Exception ex)
            {

                return null;
            }
        }
        private bool IsRemainingRestoToWaiter()
        {
            try
            {

                var waiter = GetWaiter();
                if (waiter == null)
                {
                    return false;
                }

                var restoPacket = _context.Packets.FirstOrDefault(p => p.UserId == waiter.UserId && p.PacketType == 1);
                if (restoPacket == null)
                {
                    return false;
                }

                TimeSpan remainingRestoUsageTime = restoPacket.RemainingUsageTime - DateTime.Now;
                double remainingRestoSeconds = remainingRestoUsageTime.TotalSeconds;
                if (remainingRestoSeconds <= 1)
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
        public ActionResult GetTables()
        {

            try
            {
                if (!WaiterIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingRestoToWaiter())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var waiter = GetWaiter();
                var tables = _context.Tables
                 .Where(t => t.UserId == waiter.UserId && (t.Status == 0 || t.Status == 1))
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
                return Json(tables, JsonRequestBehavior.AllowGet);

            }
            catch (Exception ex)
            {
                return View("Tables");
            }
        }
        public ActionResult Tables()
        {
            if (!WaiterIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }

            if (!IsRemainingRestoToWaiter())
            {
                return RedirectToAction("BuyPacket", "User");
            }


            return View();
        }
        public ActionResult GetAllMenuProductsToUser()
        {
            try
            {
                if (!WaiterIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingRestoToWaiter())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var waiter = GetWaiter();
                var menuProducts = _context.MenuProducts
                .Where(p => p.UserId == waiter.UserId && p.Status == 1)
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

               
                return RedirectToAction("Tables", "Waiters");
            }
        }

        [HttpPut]
        public ActionResult MakeDeActiveThisTable(int? id)
        {

            try
            {
                if (!WaiterIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingRestoToWaiter())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var waiter = GetWaiter();
                var table = _context.Tables.FirstOrDefault(t => t.UserId == waiter.UserId && t.TableId == id);

                if (table == null || id == null)
                {
                    return RedirectToAction("Tables", "Waiters");
                }


                table.Status = 0;
                table.Orders = null;
                table.OrderDate = null;
                _context.SaveChanges();

                return RedirectToAction("Tables", "Waiters");
            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Waiters");
            }

        }
        [HttpPut]
        public ActionResult MakeActiveThisTable(int? id, Tables updatedTable)
        {

            try
            {
                if (!WaiterIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingRestoToWaiter())
                {
                    return RedirectToAction("BuyPacket", "User");
                }


                var waiter =  GetWaiter();
                var table = _context.Tables.FirstOrDefault(t => t.UserId == waiter.UserId && t.TableId == id);
                if (table == null || id == null)
                {
                    return RedirectToAction("Tables", "Waiters");
                }

                
                    table.Status = 1;
                    table.Orders = updatedTable.Orders;
                    table.OrderDate = DateTime.Now;
                

                _context.SaveChanges();

                return RedirectToAction("Tables", "Waiters");
            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Waiters");
            }

        }

        public ActionResult TableDetail(int? id)
        {
            if (!WaiterIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }

            if (!IsRemainingRestoToWaiter())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            var waiter = GetWaiter();
            var table = _context.Tables.FirstOrDefault(t => t.UserId == waiter.UserId && t.TableId == id);
            if (table == null || id == null)
            {
                return RedirectToAction("Tables", "Waiters");
            }
            ViewBag.MenuCategories = _context.MenuCategories.Where(c => c.UserId == waiter.UserId && c.IsActive == 1).ToList();

            return View(table);
        }
        [HttpGet]
        public ActionResult GetTableCategories()
        {

            try
            {
                if (!WaiterIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingRestoToWaiter())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var waiter = GetWaiter();
                var categories = _context.TableCategories
                 .Where(t => t.UserId == waiter.UserId && t.IsActive == 1)
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

        [HttpPut]

        public ActionResult ChangeTables(int? id, int? changeTableId)
        {
            try
            {
                if (!WaiterIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingRestoToWaiter())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var waiter = GetWaiter();
                var table = _context.Tables.FirstOrDefault(t => t.UserId == waiter.UserId && t.TableId == id);
                var changeTable = _context.Tables.FirstOrDefault(t => t.UserId == waiter.UserId && t.TableId == changeTableId);

                if (table == null || id == null || changeTable == null || changeTableId == null)
                {
                    return RedirectToAction("Tables", "Waiters");
                }
                var orders = table.Orders;
                var orderDate = table.OrderDate;

                MakeDeActiveThisTable(id);

                changeTable.Orders = orders;
                changeTable.OrderDate = orderDate;
                changeTable.Status = 1;

                _context.SaveChanges();
                return RedirectToAction("Tables", "Waiters");

            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Waiters");
            }
        }

        [HttpPut]

        public ActionResult ConcatTables(FormCollection form)
        {
            try
            {
                if (!WaiterIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingRestoToWaiter())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var waiter = GetWaiter();
                int currentTableId = int.Parse(form["CurrentTableId"]);
                int selectedTableId = int.Parse(form["SelectedTableId"]);

                string concatOrders = form["ConcatOrders"];

                var currentTable = _context.Tables.FirstOrDefault(t => t.UserId == waiter.UserId && t.TableId == currentTableId);
                var selectedTable = _context.Tables.FirstOrDefault(t => t.UserId == waiter.UserId && t.TableId == selectedTableId);

                if (currentTable == null || selectedTable == null)
                {
                    return RedirectToAction("Tables", "Waiters");
                }

                currentTable.Status = 0;
                currentTable.Orders = null;
                currentTable.OrderDate = null;

                selectedTable.Status = 1;
                selectedTable.Orders = concatOrders;


                _context.SaveChanges();





                return RedirectToAction("Tables", "Waiters");

            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Waiters");
            }
        }


        public ActionResult AddNotification(FormCollection form)
        {
            try
            {
                if (!WaiterIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }

                if (!IsRemainingRestoToWaiter())
                {
                    return RedirectToAction("BuyPacket", "User");
                }
                var waiter = GetWaiter();

                var notification = new Notifications
                {
                    WaiterId = waiter.WaiterId,
                    TableId = int.Parse(form["TableId"]),
                    UserId = waiter.UserId,
                    TableName = form["TableName"],
                    Orders = form["Orders"],
                    OrderDate = DateTime.Now,

                };
                _context.Notifications.Add(notification);
                _context.SaveChanges();
                return RedirectToAction("Tables", "Waiters");


            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Waiters");
            }
        }
       
    }
}