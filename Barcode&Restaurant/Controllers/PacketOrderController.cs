using Barcode_Restaurant.Models;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity.Core.Common.CommandTrees.ExpressionBuilder;
using System.Drawing;
using System.Drawing.Printing;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;
using System.Web.UI.WebControls;
using System.Xml.Linq;
using static Barcode_Restaurant.Controllers.ReckoningController;

namespace Barcode_Restaurant.Controllers
{
    public class PacketOrderController : Controller
    {


        private readonly  BarcodeRestoEntities _context;

        public PacketOrderController()
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





      
        public ActionResult GetCustomers()
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


                var customers = _context.Customers
                     .Where(c => c.UserId == user.UserId && c.Status == 1)
                     .Select(x => new
                     {
                         x.CustomerId,
                         x.NameSurname,
                         x.PhoneNumber,
                         x.Adress,
                     })
                     .ToList();
                var carriers = _context.Carriers
                    .Where(c => c.UserId == user.UserId && c.Status == 1)
                    .Select(x => new
                    {
                        x.CarrierId,
                        x.NameSurname,
                        
                    })
                    .ToList();
                var response = new
                {
                    Customers = customers,
                    Carriers = carriers
                };

                return Json(response, JsonRequestBehavior.AllowGet);

                
            }
            catch (Exception ex)
            {

                return View("TakePacketOrder");
            }


        }

        [HttpPost]
        public ActionResult AddNewCustomer(string customerNameSurname, string customerPhoneNumber, string customerAdress)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return Json(new { success = false, redirectUrl = Url.Action("Login", "UserAuth") });
                }
                if (!IsRemainingResto())
                {
                    return Json(new { success = false, redirectUrl = Url.Action("BuyPacket", "User") });
                }

                var user = GetUser();

                var customer = new Customers
                {
                    UserId = user.UserId,
                    NameSurname = customerNameSurname,
                    PhoneNumber = customerPhoneNumber,
                    Adress = customerAdress,
                    Status = 1
                };

                _context.Customers.Add(customer);
                _context.SaveChanges();


                return Json(new { success = true, customerInfo = new { customer.CustomerId, customer.NameSurname, customer.PhoneNumber, customer.Adress } });

            }
            catch (Exception ex)
            {
                // Hata durumunda hata mesajı göndereceğiz
                return Json(new { success = false, error = ex.Message });
            }
        }
        [HttpPut]
        public ActionResult UpdateCustomer(FormCollection form)
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return Json(new { success = false, redirectUrl = Url.Action("Login", "UserAuth") });
                }
                if (!IsRemainingResto())
                {
                    return Json(new { success = false, redirectUrl = Url.Action("BuyPacket", "User") });
                }

                var user = GetUser();

                var customerId = Convert.ToInt32(form["CustomerId"]);
                var customer = _context.Customers.FirstOrDefault(c => c.UserId == user.UserId && c.CustomerId == customerId);

                customer.PhoneNumber = form["PhoneNumber"];
                customer.Adress = form["Adress"];
                customer.NameSurname = form["NameSurname"];

                _context.SaveChanges();
                return Json(new { success = true, customerInfo = new { customer.CustomerId, customer.NameSurname, customer.PhoneNumber, customer.Adress } });

            }
            catch (Exception ex)
            {
                return Json(new { success = false, error = ex.Message });
            }
        }



        [HttpPost]
        public ActionResult AddPacketOrder(FormCollection form)
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

                // status 
                // 1 : taked
                // 2 : delivery
                // 3 : completed


                var packetOrder = new PacketOrders
                {
                    UserId = user.UserId,
                    CustomerId = Convert.ToInt32(form["CustomerId"]),
                    CarrierId = Convert.ToInt32(form["CarrierId"]),
                    Orders = form["Orders"],
                    OrderStartingDate = DateTime.Now,
                    Status = 1,
                    CustomerNote = form["CustomerNote"]
                };

                _context.PacketOrders.Add(packetOrder);
                _context.SaveChanges();

                return RedirectToAction("Orders", "PacketOrder");
            }
            catch (Exception ex)
            {

                return Json(new { success = false, error = ex.Message });
            }
        }

        public ActionResult GetPacketOrders()
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
                var carriers = _context.Carriers
                    .Where(c => c.UserId == user.UserId && c.Status == 1)
                    .Select(x => new
                    {
                        x.CarrierId,
                        x.NameSurname,

                    })
                    .ToList();
                var customers = _context.Customers
                    .Where(c => c.UserId == user.UserId && c.Status == 1)
                    .Select(x => new
                    {
                        x.CustomerId,
                        x.NameSurname,
                        x.PhoneNumber,
                        x.Adress,
                    })
                    .ToList();

                var waitingOrders = _context.PacketOrders
                    .Where(c => c.UserId == user.UserId && c.Status == 1)
                    .Select(x => new
                    {
                        x.PacketOrderId,
                        x.CustomerId,
                        x.CarrierId,
                        x.Orders,
                        x.OrderStartingDate,
                        x.CustomerNote,
                        
                        
                    })
                    .ToList();
                var deliveryOrders = _context.PacketOrders
                    .Where(c => c.UserId == user.UserId && c.Status == 2)
                    .Select(x => new
                    {
                        x.PacketOrderId,
                        x.CustomerId,
                        x.CarrierId,
                        x.Orders,
                        x.OrderStartingDate,
                        x.CustomerNote,


                    })
                    .ToList();



                var response = new
                {
                    WaitingOrders = waitingOrders,
                    DeliveryOrders = deliveryOrders,
                    Customers = customers,
                    Carriers = carriers
                };

                return Json(response, JsonRequestBehavior.AllowGet);


            }
            catch (Exception ex)
            {

                return View("TakePacketOrder");
            }


        }


        [HttpPut]
        public ActionResult SendCarrierPacketOrder(int? id)
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

                var packetOrder = _context.PacketOrders.FirstOrDefault(c => c.UserId == user.UserId && c.PacketOrderId == id);
                packetOrder.Status = 2;
                _context.SaveChanges();

                return RedirectToAction("Orders", "PacketOrder");

            }
            catch (Exception ex)
            {

                return Json(new { success = false, error = ex.Message });
            }
        }

        public ActionResult TakePacketOrder(int? id)
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

               
                ViewBag.MenuCategories = _context.MenuCategories.Where(c => c.UserId == user.UserId && c.IsActive == 1).ToList();
                ViewBag.UserName = user.Name;
                if (id == null)
                {
                    return View(new PacketOrders());
                }
                else
                {
                    var packetOrders = _context.PacketOrders.FirstOrDefault(t => t.UserId == user.UserId && t.PacketOrderId == id);
                    
                    if (packetOrders == null)
                    {
                        return RedirectToAction("Orders", "PacketOrder"); // veya bir hata sayfasına yönlendirme yapılabilir
                    }

                    return View(packetOrders);
                }


            }
            catch (Exception ex)
            {

                return RedirectToAction("Orders", "PacketOrder");
            }

        }


        [HttpPut]
        public ActionResult UpdatePacketOrder(int? id, FormCollection form)
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

                var packetOrder = _context.PacketOrders.FirstOrDefault(c => c.UserId == user.UserId && c.PacketOrderId == id);

                packetOrder.CustomerId = Convert.ToInt32(form["CustomerId"]);
                packetOrder.CarrierId = Convert.ToInt32(form["CarrierId"]);
                packetOrder.Orders = form["Orders"];
                packetOrder.CustomerNote = form["CustomerNote"];
                packetOrder.Status = 1;

                _context.SaveChanges();

                return RedirectToAction("Orders", "PacketOrder");
            }
            catch (Exception ex)
            {
                return RedirectToAction("Orders", "PacketOrder");
            }

        }




        public ActionResult Orders()
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
                ViewBag.MenuCategories = _context.MenuCategories.Where(c => c.UserId == user.UserId && c.IsActive == 1).ToList();
                ViewBag.UserName = user.Name;


                return View();
            }
            catch (Exception ex)
            {

                return RedirectToAction("Tables", "Reckoning");
            }

        }



        public ActionResult Customers()
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

        public ActionResult AddCustomer()
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
        public ActionResult AddCustomerReq(string nameSurname, string phoneNumber, string adress)
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


                var customer = new Customers
                {
                    UserId = user.UserId,
                    NameSurname = nameSurname,
                    PhoneNumber = phoneNumber,
                    Adress = adress,
                    Status = 1,
                };

                _context.Customers.Add(customer);
                _context.SaveChanges();
                ViewBag.Message = "Müşteri başarıyla eklendi.";
                return View("AddCustomer");
            }
            catch (Exception ex)
            {
                ViewBag.Message = "Müşteri eklenirken bir hata oluştu!";
                return View("AddCustomer");
            }

        }

        public ActionResult UpdateCustomer(int? id)
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

            var customer = _context.Customers.FirstOrDefault(c => c.UserId == user.UserId && c.CustomerId == id && c.Status == 1);
            if (customer == null || id == null)
            {
                return RedirectToAction("Customers", "PacketOrder");
            }

            ViewBag.Customer = customer;
            return View();

        }
        [HttpPost]
        public ActionResult UpdateCustomerReq(string nameSurname, string phoneNumber, string adress, int id)
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

                var customer = _context.Customers.FirstOrDefault(c => c.UserId == user.UserId && c.CustomerId == id && c.Status == 1);
                if (customer == null)
                {
                    return RedirectToAction("Customers", "PacketOrder");
                }

                customer.NameSurname = nameSurname;
                customer.PhoneNumber = phoneNumber;
                customer.Adress = adress;
                ViewBag.Customer = customer;
                _context.SaveChanges();
                ViewBag.Message = "Müşteri başarıyla güncellendi.";
                return RedirectToAction("Customers", "PacketOrder");
            }
            catch (Exception ex)
            {
                ViewBag.Message = "Müşteri güncellenirken bir hata oluştu!";
                return RedirectToAction("Customers", "PacketOrder");
            }

        }


        [HttpPut]
        public ActionResult DeleteCustomer(int? id)
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

                var customer = _context.Customers.FirstOrDefault(c => c.UserId == user.UserId && c.CustomerId == id && c.Status == 1);
                if (customer == null)
                {
                    return RedirectToAction("Customers", "PacketOrder");
                }
               customer.Status = 0;
                _context.SaveChanges();
               
                return RedirectToAction("Customers", "PacketOrder");
            }
            catch (Exception ex)
            {
                
                return RedirectToAction("Customers", "PacketOrder");
            }

        }
        [HttpPut]
        public ActionResult CancelOrder(int? id)
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

                var packetOrder = _context.PacketOrders.FirstOrDefault(o => o.PacketOrderId == id && o.UserId == user.UserId  && o.Status == 1);
                if (packetOrder == null)
                {
                    return RedirectToAction("Orders", "PacketOrder");
                }
                packetOrder.Status = 4;
                packetOrder.OrderEndDate = DateTime.Now;
                _context.SaveChanges();
                return View("Orders");
            }
            catch (Exception ex)
            {

                return View("Orders");
            }

        }

    }
}