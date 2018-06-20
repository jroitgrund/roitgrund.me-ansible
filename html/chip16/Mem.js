Mem = new function()
{
  var that = this;
  var rom;
  var stack = new Array(512);

  var load_http_binary = function(url)
  {
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    //req.overrideMimeType('text/plain; charset=x-user-defined');
    req.responseType = "arraybuffer";
    req.onload = function ()
    {
      if (req.status == 200)
      {
        //return req.responseText;
        var temp = new Uint8Array(req.response);
        rom = new Uint8Array(0xFDF0);
        for (var i = 0; i < temp.byteLength; i++)
        {
          rom[i] = temp[i + 0x10];
        }
        for (var i = temp.byteLength; i < 0xFDF0; i++)
        {
          rom[i] = 0;
        }
        CPU.set_pc(temp[0x0A] + (temp[0x0B] << 8));
        return;
      }
    };
    req.send(null);
  }

  this.reset = function(url)
  {
    that.controller = new Array(2);
    load_http_binary(url);
    for (var i = 0; i < that.controller.length; i++)
    {
      that.controller[i] = 0;
    }
    for (var i = 0; i < stack.length; i++)
    {
      stack[i] = 0;
    }
  }

  this.write = function(addr, val)
  {
    if (addr < 0xFDF0)
    {
      rom[addr] = val;
    }

    else if (addr < 0xFFF0)
    {
      stack[addr] = val;
    }
  }

  this.read = function(addr)
  {
    if (addr < 0xFDF0)
    {
      //return rom.charCodeAt(addr + 0x10) & 0xFF;
      return rom[addr];
    }

    else if (addr < 0xFFF0)
    {
      return stack[addr];
    }

    else if (addr === 0xFFF0)
    {
      return that.controller[0];
    }

    else if (addr === 0xFFF2)
    {
      return that.controller[1];
    }
  }
}();
