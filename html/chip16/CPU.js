CPU = new function()
{
  var that = this;

  var pc;
  var sp;
  var reg = new Array(16);
  var c;
  var z;
  var o;
  var n;
  var width;
  var height;
  var hflip;
  var vflip;

  this.set_carry = function(set)
  {
    c = set;
  };

  this.get_pc = function()
  {
    return pc;
  };

  this.get_sp = function()
  {
    return sp;
  };

  this.get_reg = function(n)
  {
    return reg[n];
  };

  this.getc = function()
  {
    return c;
  }

  this.getz = function()
  {
    return z;

  }
  this.geto = function()
  {
    return o;
  }
  
  this.getn = function()
  {
    return n;
  }

  this.inc_pc = function()
  {
    pc += 4;
  };

  this.set_pc = function(n)
  {
    pc = n;
  }

  var gen_sprite = function(mem)
  {
    sprite = new Array();
    for (var i = 0; i < height; i++)
    {
      var row = vflip ? height - i - 1 : i;
      sprite[row] = new Array();
      for (var j = 0; j < width; j++)
      {
        var col = hflip ? width - j - 1 : j;
        var shift = j & 1 ? 0 : 4
        sprite[row][col] = Mem.read(mem + Math.floor(j / 2)) >>> shift & 0xF;
      }
      mem += Math.floor(width / 2);
    }
  };

  var get_nibble = function(blob, n)
  {
    return (blob >>> (7 - n) * 4 & 0xF);
  };

  var get_byte = function(blob, n)
  {
    return (blob >>> (3 - n) * 8 & 0xFF);
  };

  var wordify = function(lb, hb)
  {
    return (hb << 8 | lb);
  };

  var sign = function(n, bits)
  {
    if (n < 0)
    {
      return ((1 << bits) - n);
    }
    else
    {
      return n;
    }
  };

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

  var set_add_flags = function(a, b)
  {
    c = a + b > 0xFFFF;
    z = (a + b & 0xFFFF) === 0;
    o = overflow(a, b, a + b & 0xFFFF);
    n = is_negative(a + b & 0xFFFF, 16);
  };

  var set_sub_flags = function(a, b)
  {
    c = a - b < 0;
    z = a - b === 0;
    o = sub_overflow(a, b, a - b & 0xFFFF);
    n = is_negative(a - b & 0xFFFF, 16);
  };

  var set_and_flags = function(a, b)
  {
    z = (a & b) === 0;
    n = is_negative(a & b, 16);
  };

  var set_or_flags = function(a, b)
  {
    z = (a | b) === 0;
    n = is_negative(a | b, 16);
  };

  var set_xor_flags = function(a, b)
  {
    z = (a ^ b) === 0;
    n = is_negative(a ^ b, 16);
  };

  var set_mul_flags = function(a, b)
  {
    c = a * b > 0xFFFF;
    z = (a * b & 0xFFFF) === 0;
    n = is_negative(a * b & 0xFFFF, 16);
  };

  var set_div_flags = function(a, b)
  {
    c = get_signed(a, 16) % get_signed(b, 16) !== 0;
    z = (Math.floor(a / b) & 0xFFFF) === 0;
    n = is_negative(Math.floor(a / b) & 0xFFFF, 16);
  };

  var overflow = function(a, b, res)
  {
    return (is_negative(a, 16) === is_negative(b, 16) &&
        is_negative(a, 16) !== is_negative(res, 16));

  };

  var sub_overflow = function(a, b, res)
  {
    return is_negative(a, 16)
        && !is_negative(b, 16)
        && !is_negative(res, 16) ||
           !is_negative(a, 16)
        && is_negative(b, 16)
        && is_negative(res, 16)

  };

  var rightshift = function(a, b)
  {
    var c = a >>> b;
    var highbit = (a & 0x8000) === 0x8000 ? 1 : 0;
    var mask = (highbit << b + 1) - highbit;
    mask <<= 15 - b;
    c |= mask;
    return c;
  }

  var set_shift_flags = function(a)
  {
    z = a === 0;
    n = is_negative(a, 16);
  };


  var check_condition = function(cond)
  {
    switch (cond)
    {
      case 0x0:
        return z;
      case 0x1:
        return !z;
      case 0x2:
        return n;
      case 0x3:
        return !n;
      case 0x4:
        return !n && !z;
      case 0x5:
        return o;
      case 0x6:
        return !o;
      case 0x7:
        return !c && !z;
      case 0x8:
        return !c;
      case 0x9:
        return c;
      case 0xA:
        return c || z;
      case 0xB:
        return o === n && !z;
      case 0xC:
        return o === n;
      case 0xD:
        return o !== n;
      case 0xE:
        return o !== n || z;
    }
  };

  this.reset = function()
  {
    pc = 0;
    sp = 0xFDF0;
    for (var i = 0; i < reg.length; i++)
    {
      reg[i] = 0;
    }
    c = false;
    z = false;
    o = false;
    n = false;
    vflip = false;
    hflip = false;
    height = 2;
    width = 2;
    that.vblank_wait = false;
  };

  var load_palette = function(mem)
  {
    for (var i = 0; i < 16; i++)
    {
      GPU.setpalette(i, (Mem.read(mem + i * 3) << 16) +
                        (Mem.read(mem + i * 3 + 1) << 8) +
                        Mem.read(mem + i * 3 + 2)
                    );
    }
  };

  this.ops =
  {
    0x00: function() { return; },

    0x01: GPU.clear,

    0x02: function ()
    {
      that.vblank_wait = true
    },

    0x03: function(op)
    {
      GPU.set_bg(get_nibble(op, 5));
    },

    0x04: function(op)
    {
      width = get_byte(op, 2) * 2;
      height = get_byte(op, 3);
    },

    0x05: function(op)
    {
      var sprite = gen_sprite(wordify(get_byte(op, 2), get_byte(op, 3)));
      GPU.add_sprite(sprite, get_signed(reg[get_nibble(op, 3)], 16),
                             get_signed(reg[get_nibble(op, 2)], 16)
                    );
    },

    0x06: function(op)
    { 
      var sprite = gen_sprite(reg[get_nibble(op, 5)]);
      GPU.add_sprite(sprite, get_signed(reg[get_nibble(op, 3)], 16),
                             get_signed(reg[get_nibble(op, 2)], 16)
                    );
    },

    0x07: function(op)
    {
      reg[get_nibble(op, 3)] = Math.floor(Math.random() *
                                          (wordify(get_byte(op, 2),
                                                  get_byte(op, 3)
                                                  ) + 1)
                                         );
    },

    0x08: function(op)
    {
      hflip = Boolean(op >>> 1 & 1);
      vflip = Boolean(op & 1);
    },

    0x09: function() {return;},
    0x0A: function() {return;},
    0x0B: function() {return;},
    0x0C: function() {return;},
    0x0D: function() {return;},
    0x0E: function() {return;},

    0x10: function(op)
    {
      pc = wordify(get_byte(op, 2), get_byte(op, 3));
    },

    0x12: function(op)
    {
      if (check_condition(get_nibble(op, 3)))
      {
        pc = wordify(get_byte(op, 2), get_byte(op, 3));
      }
    },

    0x13: function(op)
    {
      if (reg[get_nibble(op, 2)] === reg[get_nibble(op, 3)])
      {
        pc = wordify(get_byte(op, 2), get_byte(op, 3));
      }
    },

    0x16: function(op)
    {
      pc = reg[get_nibble(op, 3)];
    },

    0x14: function(op)
    {
      Mem.write(sp++, pc & 0xFF);
      Mem.write(sp++, pc >>> 8);
      pc = wordify(get_byte(op, 2), get_byte(op, 3));
    },

    0x15: function()
    {
      sp -= 2;
      pc = wordify(Mem.read(sp), Mem.read(sp + 1));
    },

    0x17: function(op)
    {
      if (check_condition(get_nibble(op, 3)))
      {
        Mem.write(sp++, pc & 0xFF);
        Mem.write(sp++, pc >>> 8);
        pc = wordify(get_byte(op, 2), get_byte(op, 3));
      }
    },

    0x18: function(op)
    {
      Mem.write(sp++, pc & 0xFF);
      Mem.write(sp++, pc >>> 8);
      pc = reg[get_nibble(op, 3)];
    },

    0x20: function(op)
    {
      reg[get_nibble(op, 3)] = wordify(get_byte(op, 2), get_byte(op, 3));
    },

    0x21: function(op)
    {
      sp = wordify(get_byte(op, 2), get_byte(op, 3));
    },

    0x22: function(op)
    {
      var addr = wordify(get_byte(op, 2), get_byte(op, 3));
      reg[get_nibble(op, 3)] = Mem.read(addr) + (Mem.read(addr + 1) << 8);
    },

    0x23: function(op)
    {
      var addr = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 3)] = Mem.read(addr) + (Mem.read(addr + 1) << 8);
    },

    0x24: function(op)
    {
      reg[get_nibble(op, 3)] = reg[get_nibble(op, 2)];
    },

    0x30: function(op)
    {
      var addr = wordify(get_byte(op, 2), get_byte(op, 3));
      var val = reg[get_nibble(op, 3)];
      Mem.write(addr, val & 0xFF);
      Mem.write(addr + 1, val >>> 8);
    },

    0x31: function(op)
    {
      var addr = reg[get_nibble(op, 2)];
      var val = reg[get_nibble(op, 3)];
      Mem.write(addr, val & 0xFF);
      Mem.write(addr + 1, val >>> 8);
    },

    0x40: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = wordify(get_byte(op, 2), get_byte(op, 3));
      reg[get_nibble(op, 3)] = a + b & 0xFFFF;
      set_add_flags(a, b);
    },

    0x41: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 3)] = a + b & 0xFFFF;
      set_add_flags(a, b);
    },

    0x42: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 5)] = a + b & 0xFFFF;
      set_add_flags(a, b);
    },

    0x50: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = wordify(get_byte(op, 2), get_byte(op, 3));
      reg[get_nibble(op, 3)] = a - b & 0xFFFF;
      set_sub_flags(a, b);
    },

    0x51: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 3)] = a - b & 0xFFFF;
      set_sub_flags(a, b);
    },

    0x52: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 5)] = a - b & 0xFFFF;
      set_sub_flags(a, b);
    },

    0x53: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = wordify(get_byte(op, 2), get_byte(op, 3));
      set_sub_flags(a, b);
    },

    0x54: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      set_sub_flags(a, b);
    },

    0x60: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = wordify(get_byte(op, 2), get_byte(op, 3));
      reg[get_nibble(op, 3)] = a & b;
      set_and_flags(a, b);
    },

    0x61: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 3)] = a & b;
      set_and_flags(a, b);
    },

    0x62: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 5)] = a & b;
      set_and_flags(a, b);
    },

    0x63: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = wordify(get_byte(op, 2), get_byte(op, 3));
      set_and_flags(a, b);
    },

    0x64: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      set_and_flags(a, b);
    },

    0x70: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = wordify(get_byte(op, 2), get_byte(op, 3));
      reg[get_nibble(op, 3)] = a | b;
      set_or_flags(a, b);
    },

    0x71: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 3)] = a | b;
      set_or_flags(a, b);
    },

    0x72: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 5)] = a | b;
      set_or_flags(a, b);
    },

    0x80: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = wordify(get_byte(op, 2), get_byte(op, 3));
      reg[get_nibble(op, 3)] = a ^ b;
      set_xor_flags(a, b);
    },

    0x81: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 3)] = a ^ b;
      set_xor_flags(a, b);
    },

    0x82: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 5)] = a ^ b;
      set_xor_flags(a, b);
    },

    0x90: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = wordify(get_byte(op, 2), get_byte(op, 3));
      reg[get_nibble(op, 3)] = a * b & 0xFFFF;
      set_mul_flags(a, b);
    },

    0x91: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 3)] = a * b & 0xFFFF;
      set_mul_flags(a, b);
    },

    0x92: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 5)] = a * b & 0xFFFF;
      set_mul_flags(a, b);
    },

    0xA0: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = wordify(get_byte(op, 2), get_byte(op, 3));
      reg[get_nibble(op, 3)] = Math.floor(a / b) & 0xFFFF;
      set_div_flags(a, b);
    },

    0xA1: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 3)] = Math.floor(a / b) & 0xFFFF;
      set_div_flags(a, b);
    },

    0xA2: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)];
      reg[get_nibble(op, 5)] = Math.floor(a / b) & 0xFFFF;
      set_div_flags(a, b);
    },

    0xB0: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = get_nibble(op, 5);
      reg[get_nibble(op, 3)] = a << b & 0xFFFF;
      set_shift_flags(a << b & 0xFFFF);
    },

    0xB1: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = get_nibble(op, 5);
      reg[get_nibble(op, 3)] = a >>> b;
      set_shift_flags(a >>> b);
    },

    0xB2: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = get_nibble(op, 5);
      reg[get_nibble(op, 3)] = rightshift(a, b);
      set_shift_flags(rightshift(a, b));
    },

    0xB3: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)] & 0xF;
      reg[get_nibble(op, 3)] = a << b & 0xFFFF;
      set_shift_flags(a << b & 0xFFFF);
    },

    0xB4: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)] & 0xF;
      reg[get_nibble(op, 3)] = a >>> b;
      set_shift_flags(a >>> b);
    },

    0xB5: function(op)
    {
      var a = reg[get_nibble(op, 3)];
      var b = reg[get_nibble(op, 2)] & 0xF;
      reg[get_nibble(op, 3)] = rightshift(a, b);
      set_shift_flags(rightshift(a, b));
    },

    0xC0: function(op)
    {
      Mem.write(sp++, reg[get_nibble(op, 3)] & 0xFF);
      Mem.write(sp++, reg[get_nibble(op, 3)] >>> 8);
    },

    0xC1: function(op)
    {
      sp -= 2;
      reg[get_nibble(op, 3)] = wordify(Mem.read(sp), Mem.read(sp + 1));
    },

    0xC2: function(op)
    {
      for (var i = 0; i < 16; i++)
      {
        Mem.write(sp++, reg[i] & 0xFF);
        Mem.write(sp++, reg[i] >>> 8);
      }
    },

    0xC3: function(op)
    {
      sp -= 32;
      for (var i = 0; i < 16; i++)
      {
        reg[i] = wordify(Mem.read(sp + 2 * i), Mem.read(sp + 2 * i + 1));
      }
    },

    0xC4: function(op)
    {
      var flag = c << 1 | z << 2 | o << 6 | n << 7;
      Mem.write(sp++, flag);
      sp++;
    },

    0xC5: function(op)
    {
      sp -= 2;
      flag = Mem.read(sp);
      c = flag >>> 1 & 1;
      z = flag >>> 2 & 1;
      o = flag >>> 6 & 1;
      n = flag >>> 7 & 1;
    },

    0xD0: function(op)
    {
      load_palette(wordify(get_byte(op, 2), get_byte(op, 3)));
    },

    0xD1: function(op)
    {
      load_palette(reg[get_nibble(op, 3)]);
    }
                           
  };
}();
