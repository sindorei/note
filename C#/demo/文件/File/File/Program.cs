using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;

namespace FileTest
{
    class Program
    {
        static void Main(string[] args)
        {
            string str = "我是Cortana，小娜。有问题尽管问我。";
            //FileStream fs = new FileStream("test.txt",FileMode.Create);
            //byte[] buffer = Encoding.UTF8.GetBytes(str);
            //fs.Write(buffer, 0, buffer.Length);
            //fs.Flush();
            //fs.Close();
            //fs.Dispose();
            using (FileStream fs = new FileStream("test2.txt", FileMode.Create))
            {
                byte[] buffer = Encoding.UTF8.GetBytes(str);
                fs.Write(buffer, 0, buffer.Length);
            }
            Console.Write("OK");
            Console.ReadKey();
        }
    }
}
