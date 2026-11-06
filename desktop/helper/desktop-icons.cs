/*
 * Tells the program where the icons on the desktop are, for the cat to play with.
 *
 * It only looks. It asks the shell, through its documented interfaces, for the
 * position of each icon, and checks the order and size of the windows on the screen
 * to see which icons are not covered right now. It never reads an icon's name, never
 * moves or opens anything, and has no way out to the network: it answers on its
 * standard output and ends as soon as the program closes its standard input.
 *
 * Asked "scan", it answers with one line of JSON, and "image <id>" with one icon's
 * picture as PNG in base64. The program asks only while the cat's game with the
 * icons is switched on in its settings.
 *
 * Built with the C# compiler that comes with Windows, see tools/build-helper.js.
 */
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32;

[StructLayout(LayoutKind.Sequential)] struct POINT { public int X, Y; }
[StructLayout(LayoutKind.Sequential)] struct SIZE { public int W, H; }
[StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }

[ComImport, Guid("85CB6900-4D95-11CF-960C-0080C7F4EE85"), InterfaceType(ComInterfaceType.InterfaceIsDual)]
interface IShellWindows {
  void _VtblGap1_8();
  [return: MarshalAs(UnmanagedType.IDispatch)]
  object FindWindowSW([In] ref object location, [In] ref object root, int windowClass, out int hwnd, int options);
}

[ComImport, Guid("6D5140C1-7436-11CE-8034-00AA006009FA"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IServiceProviderCom {
  [return: MarshalAs(UnmanagedType.IUnknown)]
  object QueryService([In] ref Guid service, [In] ref Guid iid);
}

[ComImport, Guid("000214E2-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IShellBrowser {
  void _VtblGap1_12();
  [return: MarshalAs(UnmanagedType.IUnknown)]
  object QueryActiveShellView();
}

[ComImport, Guid("000214E3-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IShellView {
  void GetWindow(out IntPtr hwnd);
}

[ComImport, Guid("CDE725B0-CCC9-4519-917E-325D72FAB4CE"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IFolderView {
  void _VtblGap1_2();
  void GetFolder([In] ref Guid iid, [MarshalAs(UnmanagedType.IUnknown)] out object folder);
  void Item(int index, out IntPtr pidl);
  void ItemCount(uint flags, out int count);
  void _VtblGap2_3();
  void GetItemPosition(IntPtr pidl, out POINT position);
  void GetSpacing(out POINT spacing);
}

[ComImport, Guid("BCC18B79-BA16-442F-80C4-8A59C30C463B"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IShellItemImageFactory {
  void GetImage(SIZE size, int flags, out IntPtr bitmap);
}

static class Program {
  const uint SVGIO_ALLVIEW = 2;
  const int SWC_DESKTOP = 8;
  const int SWFO_NEEDDISPATCH = 1;
  const int GWL_EXSTYLE = -20;
  const int WS_EX_TRANSPARENT = 0x20;
  const int DWMWA_CLOAKED = 14;
  const int SIIGBF_BIGGERSIZEOK = 1;
  const int SIIGBF_ICONONLY = 4;

  delegate bool EnumProc(IntPtr hwnd, IntPtr data);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc proc, IntPtr data);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hwnd);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr hwnd);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
  [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr hwnd, int index);
  [DllImport("user32.dll")] static extern IntPtr GetAncestor(IntPtr hwnd, uint flags);
  [DllImport("user32.dll")] static extern bool ClientToScreen(IntPtr hwnd, ref POINT point);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr hwnd, int attribute, out int value, int size);
  [DllImport("shell32.dll")] static extern uint ILGetSize(IntPtr pidl);
  [DllImport("shell32.dll", PreserveSig = false)]
  static extern void SHCreateItemWithParent(IntPtr parentPidl, [MarshalAs(UnmanagedType.IUnknown)] object parentFolder, IntPtr pidl, [In] ref Guid iid, [MarshalAs(UnmanagedType.IUnknown)] out object item);
  [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr handle);
  [DllImport("gdi32.dll")] static extern int GetObject(IntPtr handle, int size, out BITMAP bitmap);

  [StructLayout(LayoutKind.Sequential)]
  struct BITMAP { public int Type, Width, Height, WidthBytes; public short Planes, BitsPixel; public IntPtr Bits; }

  static uint ownPid;

  [STAThread]
  static int Main(string[] args) {
    SetProcessDPIAware();
    if (args.Length > 0) uint.TryParse(args[0], out ownPid);
    var input = new StreamReader(Console.OpenStandardInput());
    var output = new StreamWriter(Console.OpenStandardOutput(), new UTF8Encoding(false));
    string line;
    while ((line = input.ReadLine()) != null) {
      string answer;
      try {
        if (line == "scan") answer = Scan();
        else if (line.StartsWith("image ")) answer = Image(line.Substring(6));
        else answer = "{\"error\":\"unknown request\"}";
      } catch (Exception error) {
        answer = "{\"error\":\"" + error.GetType().Name + "\"}";
      }
      output.WriteLine(answer);
      output.Flush();
    }
    return 0;
  }

  /* The desktop's own folder view, by the route the shell documents for it. */
  static object DesktopView(out IFolderView view) {
    var windows = (IShellWindows)Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid("9BA05972-F6A8-11CF-A442-00A0C90A8F39")));
    object location = 0;
    object root = null;
    int hwnd;
    object dispatch = windows.FindWindowSW(ref location, ref root, SWC_DESKTOP, out hwnd, SWFO_NEEDDISPATCH);
    var service = new Guid("4C96BE40-915C-11CF-99D3-00AA004AE837");
    var browserId = new Guid("000214E2-0000-0000-C000-000000000046");
    var browser = (IShellBrowser)((IServiceProviderCom)dispatch).QueryService(ref service, ref browserId);
    object shellView = browser.QueryActiveShellView();
    view = (IFolderView)shellView;
    return shellView;
  }

  /* The size the desktop draws its icons at, as set in its View menu, on this screen. */
  static int IconSize() {
    object saved = Registry.GetValue(@"HKEY_CURRENT_USER\Software\Microsoft\Windows\Shell\Bags\1\Desktop", "IconSize", 48);
    int size = saved is int ? (int)saved : 48;
    using (var graphics = Graphics.FromHwnd(IntPtr.Zero)) {
      return (int)Math.Round(size * graphics.DpiX / 96f);
    }
  }

  /* Short, stable, and says nothing of what the icon is. */
  static string IdOf(IntPtr pidl) {
    int size = (int)ILGetSize(pidl);
    var bytes = new byte[size];
    Marshal.Copy(pidl, bytes, 0, size);
    uint hash = 2166136261;
    foreach (byte b in bytes) hash = (hash ^ b) * 16777619;
    return hash.ToString("x8");
  }

  /* The windows lying over the desktop, top first. */
  static List<RECT> WindowsOver(IntPtr desktopRoot) {
    var found = new List<RECT>();
    EnumWindows(delegate (IntPtr hwnd, IntPtr data) {
      if (hwnd == desktopRoot) return false;
      if (!IsWindowVisible(hwnd) || IsIconic(hwnd)) return true;
      uint pid;
      GetWindowThreadProcessId(hwnd, out pid);
      if (pid == ownPid) return true;
      if ((GetWindowLong(hwnd, GWL_EXSTYLE) & WS_EX_TRANSPARENT) != 0) return true;
      int cloaked;
      if (DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED, out cloaked, 4) == 0 && cloaked != 0) return true;
      RECT rect;
      if (GetWindowRect(hwnd, out rect) && rect.R > rect.L && rect.B > rect.T) found.Add(rect);
      return true;
    }, IntPtr.Zero);
    return found;
  }

  static string Scan() {
    IFolderView view;
    object shellView = DesktopView(out view);
    IntPtr viewWindow;
    ((IShellView)shellView).GetWindow(out viewWindow);
    var text = new StringBuilder();
    // Icons switched off on the desktop: nothing there to play with.
    if (!IsWindowVisible(viewWindow)) return "{\"icons\":[]}";

    POINT origin = new POINT();
    ClientToScreen(viewWindow, ref origin);
    POINT spacing;
    view.GetSpacing(out spacing);
    int iconSize = IconSize();
    var over = WindowsOver(GetAncestor(viewWindow, 2));

    int count;
    view.ItemCount(SVGIO_ALLVIEW, out count);
    text.Append("{\"spacing\":[" + spacing.X + "," + spacing.Y + "],\"iconSize\":" + iconSize + ",\"icons\":[");
    for (int i = 0; i < count; i += 1) {
      IntPtr pidl;
      view.Item(i, out pidl);
      POINT at;
      view.GetItemPosition(pidl, out at);
      string id = IdOf(pidl);
      Marshal.FreeCoTaskMem(pidl);
      int x = at.X + origin.X;
      int y = at.Y + origin.Y;
      int cx = x + spacing.X / 2;
      int cy = y + iconSize / 2;
      bool seen = true;
      foreach (RECT r in over) {
        if (cx >= r.L && cx < r.R && cy >= r.T && cy < r.B) {
          seen = false;
          break;
        }
      }
      if (i > 0) text.Append(",");
      text.Append("{\"id\":\"" + id + "\",\"x\":" + x + ",\"y\":" + y + ",\"seen\":" + (seen ? "true" : "false") + "}");
    }
    text.Append("]}");
    return text.ToString();
  }

  /* One icon's picture, only so that a copy of it can wobble when the ball hits it. */
  static string Image(string id) {
    IFolderView view;
    DesktopView(out view);
    int count;
    view.ItemCount(SVGIO_ALLVIEW, out count);
    var shellFolderId = new Guid("000214E6-0000-0000-C000-000000000046");
    object folder;
    view.GetFolder(ref shellFolderId, out folder);
    for (int i = 0; i < count; i += 1) {
      IntPtr pidl;
      view.Item(i, out pidl);
      try {
        if (IdOf(pidl) != id) continue;
        var itemId = new Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE");
        object item;
        SHCreateItemWithParent(IntPtr.Zero, folder, pidl, ref itemId, out item);
        IntPtr handle;
        SIZE size = new SIZE { W = 96, H = 96 };
        ((IShellItemImageFactory)item).GetImage(size, SIIGBF_BIGGERSIZEOK | SIIGBF_ICONONLY, out handle);
        try {
          return "{\"id\":\"" + id + "\",\"png\":\"" + PngOf(handle) + "\"}";
        } finally {
          DeleteObject(handle);
        }
      } finally {
        Marshal.FreeCoTaskMem(pidl);
      }
    }
    return "{\"id\":\"" + id + "\"}";
  }

  /* The shell's bitmap keeps its transparency, which Image.FromHbitmap would lose. */
  static string PngOf(IntPtr handle) {
    BITMAP info;
    GetObject(handle, Marshal.SizeOf(typeof(BITMAP)), out info);
    using (var bitmap = new Bitmap(info.Width, info.Height, PixelFormat.Format32bppArgb)) {
      var data = bitmap.LockBits(new Rectangle(0, 0, info.Width, info.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
      for (int row = 0; row < info.Height; row += 1) {
        var from = new IntPtr(info.Bits.ToInt64() + row * info.WidthBytes);
        var to = new IntPtr(data.Scan0.ToInt64() + (info.Height - 1 - row) * data.Stride);
        var pixels = new byte[info.Width * 4];
        Marshal.Copy(from, pixels, 0, pixels.Length);
        Marshal.Copy(pixels, 0, to, pixels.Length);
      }
      bitmap.UnlockBits(data);
      using (var stream = new MemoryStream()) {
        bitmap.Save(stream, ImageFormat.Png);
        return Convert.ToBase64String(stream.ToArray());
      }
    }
  }
}
