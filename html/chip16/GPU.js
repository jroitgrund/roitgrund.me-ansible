GPU = new function()
{
  var sprites;
  var palette;
  var framebuffer;
  var canvas;
  var occupied;
  var bg;

  this.reset = function()
  {
    palette =
      [
        0x000000,
        0x000000,
        0x888888,
        0xBF3932,
        0xDE7AAE,
        0x4C3D21,
        0x905F25,
        0xE49452,
        0xEAD979,
        0x537A3B,
        0xABD54A,
        0x252E38,
        0x00467F,
        0x68ABCC,
        0xBCDEE4,
        0xFFFFFF
      ];
    canvas = document.getElementById('screen').getContext('2d');
    framebuffer = canvas.createImageData(320, 240);
    occupied = new Array();
    bg = 0;
    for (var i = 0; i < 240; i++)
    {
      occupied[i] = new Array();
      for (var j = 0; j < 320; j++)
      {
        occupied[i][j] = false;
      }
    }
    this.clear();
    this.draw();
  };

  this.setpalette = function(i, colors)
  {
    palette[i] = colors;
  };

  this.clear = function()
  {
    for (var i = 0; i < 240; i++)
    {
      for (var j = 0; j < 320; j++)
      {
        var offset = (j + i * 320) * 4;
        framebuffer.data[offset]     = palette[0] >>> 16 & 0xFF;
        framebuffer.data[offset + 1] = palette[0] >>> 8  & 0xFF;
        framebuffer.data[offset + 2] = palette[0]       & 0xFF;
        framebuffer.data[offset + 3] = 0xFF;
      }
    }

    for (var i = 0; i < 240; i++)
    {
      for (var j = 0; j < 320; j++)
      {
        occupied[i][j] = false;
      }
    }
  };

  this.set_bg = function(colour)
  {
    for (var i = 0; i < 240; i++)
    {
      for (var j = 0; j < 320; j++)
      {
        if (!occupied[i][j])
        {
          var offset = (j + i * 320) * 4;
          framebuffer.data[offset]     = palette[colour] >>> 16 & 0xFF;
          framebuffer.data[offset + 1] = palette[colour] >>> 8  & 0xFF;
          framebuffer.data[offset + 2] = palette[colour]       & 0xFF;
        }
      }
    }
    bg = colour;
  };

  this.add_sprite = function(s, x, y)
  {
    for (var i = y < 0 ? -y : 0; i + y < 240 && i < sprite.length; i++)
    {
      for (var j = x < 0 ? -x : 0; x + j < 320 && j < sprite[i].length; j++)
      {
        var ypos = i + y;
        var xpos = j + x;
        var colour = sprite[i][j];
        if (colour !== 0x0)
        {
          CPU.set_carry(occupied[ypos][xpos]);
          occupied[ypos][xpos] = true;
          var offset = (xpos + ypos * 320) * 4;
          framebuffer.data[offset]     = palette[colour] >>> 16 & 0xFF;
          framebuffer.data[offset + 1] = palette[colour] >>> 8  & 0xFF;
          framebuffer.data[offset + 2] = palette[colour]       & 0xFF;
        }
        occupied[ypos][xpos] = true;
      }
    }
  };

  this.draw = function()
  {
    if (CPU.vblank_wait)
    {
      CPU.vblank_wait = false;
    }
    canvas.putImageData(framebuffer, 0, 0);
  }

}();
