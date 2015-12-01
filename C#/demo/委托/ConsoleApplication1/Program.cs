using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ConsoleApplication1
{
    class Program
    {
        static void Main(string[] args)
        {
            string str = ModifyString("你好啊",  o => "※" + o + "※" );
            Console.WriteLine(str);
            Console.ReadKey();
        }

        public static string ModifyString(string str, Func<string,string> handlerDelegate)
        {
            return handlerDelegate(str);
        }
    }
}
