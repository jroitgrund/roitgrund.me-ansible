Main = new function()
{
  var that = this;
  var cycles;

  var updateMem = function()
  {
    if (Mem.controller)
    {
      Mem.controller[0] = 0;
      Mem.controller[0] += that.keys.up;
      Mem.controller[0] += that.keys.down << 1;
      Mem.controller[0] += that.keys.left << 2;
      Mem.controller[0] += that.keys.right << 3;
      Mem.controller[0] += that.keys.select << 4;
      Mem.controller[0] += that.keys.start << 5;
      Mem.controller[0] += that.keys.a << 6;
      Mem.controller[0] += that.keys.b << 7;
    }
  }

  var updatedebug = function()
  {
    for (var i = 0; i < 16; i++)
    {
      document.getElementById('r' + i).innerHTML = get_signed(CPU.get_reg(i),16);
    }
    document.getElementById('c').innerHTML = CPU.getc();
    document.getElementById('z').innerHTML = CPU.getz();
    document.getElementById('o').innerHTML = CPU.geto();
    document.getElementById('n').innerHTML = CPU.getn();
    document.getElementById('sp').innerHTML = nicehex(CPU.get_sp(),16);
    document.getElementById('pc').innerHTML = nicehex(CPU.get_pc(),16);
  }

  this.event_handler = function()
  {
    that.keys = 
    {
      left: 0,
      up: 0,
      right: 0,
      down: 0,
      select: 0,
      start: 0,
      a: 0,
      b: 0
    };

    window.onkeydown = function (e)
    {
      switch (e.keyCode || e.which)
      {
        case 37:
            that.keys.left = 1;
            break;
        case 38:
            that.keys.up = 1;
            break;
        case 39:
            that.keys.right = 1;
            break;
        case 40:
            that.keys.down = 1;
            break;
        case 16:
            that.keys.select = 1;
            break;
        case 13:
            that.keys.start = 1;
            break;
        case 90:
            that.keys.a = 1;
            break;
        case 88:
            that.keys.b = 1
            break;
      }
    }

    window.onkeyup = function (e)
    {
      switch (e.keyCode || e.which)
      {
        case 37:
            that.keys.left = 0;
            break;
        case 38:
            that.keys.up = 0;
            break;
        case 39:
            that.keys.right = 0;
            break;
        case 40:
            that.keys.down = 0;
            break;
        case 16:
            that.keys.select = 0;
            break;
        case 13:
            that.keys.start = 0;
            break;
        case 90:
            that.keys.a = 0;
            break;
        case 88:
            that.keys.b = 0
            break;
      }
    }
  }


  this.init = function(file)
  {

    CPU.reset();
    Mem.reset('roms/' + file);
    GPU.reset();
    cycles = 0;
    that.paused = true;
    document.getElementById("pause").onclick = that.resume;
    if (that.timer)
    {
      clearInterval(that.timer);
    }
  };

  this.step = function()
  {
    if (!CPU.vblank_wait)
    {
      var pc = CPU.get_pc();
      var op = Mem.read(pc++) << 24;
      op += Mem.read(pc++) << 16;
      op += Mem.read(pc++) << 8;
      op += Mem.read(pc++);
      CPU.inc_pc();
      CPU.ops[op >>> 24](op);
      if (that.paused)
      {
        updatedebug();
        cycles++;
        GPU.draw();
        if (cycles >= 1000000 / 60 || CPU.vblank_wait)
        {
          cycles = 0;
        }
      }
    }
  };

  this.pause = function()
  {
    that.paused = true;
    clearInterval(that.timer);
    updatedebug();
    document.getElementById("pause").onclick = that.resume;
  };

  this.resume = function()
  {
    that.paused = false;
    document.getElementById("pause").onclick = that.pause;
    that.timer = setInterval(that.run, 1000 / 60);
  };

  this.run = function()
  {
    updateMem();
    while (cycles < 1000000 / 60 && !CPU.vblank_wait)
    {
      that.step();
      cycles++;
    }
    GPU.draw();
    cycles = 0;
  };

  var nicehex = function(val, bits)
  {
    return "0x" + ("000000000000000" + val.toString(16)).substr(-Math.floor(bits/4));
  }

  var get_signed = function(n, bits)
  {
    if (is_negative(n, bits))
    {
      return n - (1 << bits);
    }
    else
    {
      return n;
    }
  };

  var is_negative = function(n, bits)
  {
    return (n & (1 << bits - 1)) !==0;
  };

}();
