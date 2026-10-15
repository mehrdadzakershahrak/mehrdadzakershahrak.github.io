"""Draw the original MZ Vellum Display outline masters and compile them.

All paths below are independent drawings in a 1000 unit em.  The pen expansion
is elliptical: upright strokes carry ink while cross strokes remain light.
The resulting UFO contains real, editable contours, not bitmap autotraces.
"""
from __future__ import annotations

import unicodedata
from pathlib import Path

import pathops
import ufoLib2
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont


EM = 1000
CAP = 710
XHEIGHT = 474
GLYPHS: dict[str, tuple[pathops.Path, int]] = {}


def shape(svg: str) -> pathops.Path:
    result = pathops.Path()
    parse_path(svg, result.getPen())
    return result


def union(*paths: pathops.Path) -> pathops.Path:
    result = pathops.Path()
    for path in paths:
        result = pathops.op(result, path, pathops.PathOp.UNION)
    return result


def ink(svg: str, weight: float = 42, hair: float = 10) -> pathops.Path:
    # Broader upright ink gives the display face its calligraphic contrast.
    # Horizontal hairlines keep their original width.
    weight *= 1.7
    source = shape(svg).transform(scaleY=weight / hair)
    source.stroke(weight, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 3)
    source.convertConicsToQuads(0.05)
    return source.transform(scaleY=hair / weight)


def line(x1, y1, x2, y2, width=11) -> pathops.Path:
    return ink(f"M{x1} {y1}L{x2} {y2}", width, width)


def dot(x, y, radius=17) -> pathops.Path:
    k = radius * 0.55228475
    return shape(f"M{x+radius} {y}C{x+radius} {y+k} {x+k} {y+radius} {x} {y+radius}"
                 f"C{x-k} {y+radius} {x-radius} {y+k} {x-radius} {y}"
                 f"C{x-radius} {y-k} {x-k} {y-radius} {x} {y-radius}"
                 f"C{x+k} {y-radius} {x+radius} {y-k} {x+radius} {y}Z")


def stem(x, bottom=16, top=458, width=39) -> pathops.Path:
    width *= 1.7
    half = width / 2
    return shape(f"M{x-half} {bottom+20}L{x+3} {bottom-5}L{x+half+19} {bottom+23}"
                 f"L{x+half} {bottom+39}L{x+half} {top-25}L{x+half+13} {top-8}"
                 f"L{x-3} {top+18}L{x-half-17} {top-9}L{x-half} {top-29}Z")


def bowl(left=71, right=249, bottom=10, top=472, weight=43) -> pathops.Path:
    middle = (left + right) / 2
    return ink(f"M{middle} {top}C{left+10} {top-45} {left} {top-68} {left} {top-119}"
               f"L{left} {bottom+112}C{left} {bottom+68} {left+29} {bottom+35} {middle} {bottom}"
               f"C{right-12} {bottom+42} {right} {bottom+67} {right} {bottom+112}"
               f"L{right} {top-119}C{right} {top-75} {right-26} {top-35} {middle} {top}Z", weight, 11)


def arch(left, right, bottom=35, top=467) -> pathops.Path:
    return ink(f"M{left} {top-68}Q{left+33} {top-35} {(left+right)/2} {top}"
               f"Q{right} {top-34} {right} {top-91}L{right} {bottom}", 40, 10)


def place(character: str, width: int, *paths: pathops.Path) -> None:
    GLYPHS[character] = (union(*paths), width)


def translated(character: str, dx=0, dy=0, sx=1, sy=1) -> pathops.Path:
    return GLYPHS[character][0].transform(scaleX=sx, scaleY=sy, translateX=dx, translateY=dy)


def letters() -> None:
    # Capitals balance pointed bowls with clear, Roman-derived skeletons.
    place("A", 510, ink("M49 13L242 713L455 13", 43, 10),
          line(111, 252, 375, 252), shape("M22 10L82 45L95 10ZM414 10L476 10L450 45Z"))
    place("B", 475, stem(88, 16, 692, 43),
          ink("M92 696Q208 742 320 684Q397 649 381 540Q372 440 115 370"
              "M114 370Q325 414 395 282Q440 171 354 77Q249-10 93 15", 43, 11))
    place("C", 486, ink("M408 644Q330 744 220 698Q65 632 65 350Q65 98 213 21Q321-25 416 85", 46, 11),
          shape("M381 669L429 684L419 611Z"), shape("M404 110L432 96L421 71Z"))
    place("D", 509, stem(88, 16, 692, 43), ink("M93 695Q258 758 367 639Q445 550 445 354"
              "Q445 166 355 76Q241-9 93 16", 47, 11))
    place("E", 428, stem(83, 16, 692, 42), line(83, 701, 358, 701),
          line(92, 370, 316, 370), line(87, 17, 372, 17),
          shape("M342 701L373 727L363 647ZM300 370L326 399L319 338ZM357 17L387 62L380 0Z"))
    place("F", 420, stem(83, 16, 692, 42), line(83, 701, 367, 701), line(90, 370, 313, 370),
          shape("M350 701L378 727L372 647ZM298 370L326 398L319 337Z"))
    place("G", 510, ink("M414 641Q328 739 218 697Q65 632 65 350Q65 102 214 23Q322-26 422 74"
              "M423 74L423 325L306 325", 45, 11), shape("M388 670L432 684L424 608Z"))
    place("H", 512, stem(88, 16, 692, 43), stem(422, 16, 692, 43),
          ink("M89 352Q250 378 420 352", 14, 10))
    place("I", 220, stem(108, 16, 692, 44),
          line(18, 700, 198, 700, 11), line(18, 17, 198, 17, 11))
    place("J", 350, stem(259, 94, 692, 44),
          ink("M260 122Q253-8 144 2Q65 10 47 84", 39, 11), dot(52, 91, 19))
    place("K", 496, stem(88, 16, 692, 43), ink("M410 702L109 350L427 17", 43, 10),
          shape("M387 706L436 726L420 686ZM401 14L456 14L417 47Z"))
    place("L", 410, stem(88, 16, 692, 43),
          ink("M91 16Q233 56 358 15", 18, 11), shape("M344 12L385 67L371-2Z"))
    place("M", 663, stem(84, 16, 692, 40), stem(576, 16, 692, 44),
          ink("M84 701L324 79L576 701", 37, 10), line(327, 83, 327, 10, 11))
    place("N", 529, stem(86, 16, 692, 37), stem(439, 16, 692, 38),
          ink("M88 700L438 18", 43, 10))
    place("O", 522, bowl(69, 453, 9, 713, 46))
    place("P", 468, stem(88, 16, 692, 43),
          ink("M93 694Q233 755 350 655Q410 592 379 480Q326 348 111 365", 45, 11))
    place("Q", 527, translated("O"),
          ink("M279 122Q339 78 398-2Q438-66 498-39", 34, 9))
    place("R", 501, translated("P"), ink("M225 371Q282 348 324 253L425 24", 40, 10),
          shape("M410 23L460 10L426 53Z"))
    place("S", 452, ink("M374 648Q310 737 214 699Q77 645 101 521Q118 446 239 360"
              "Q391 261 370 142Q351 31 233 12Q112-6 64 83", 45, 11),
          shape("M349 669L391 681L383 608Z"), dot(66, 87, 15))
    place("T", 448, stem(224, 16, 686, 43), line(43, 702, 403, 702),
          shape("M42 701L26 659L31 728ZM392 702L413 728L414 654Z"))
    place("U", 519, stem(86, 152, 692, 42), stem(430, 95, 692, 40),
          ink("M86 178Q76 85 171 22Q224-13 288 23L430 120", 42, 11))
    place("V", 496, ink("M53 702L247 8L444 702", 45, 10),
          shape("M26 708L79 708L61 671ZM418 704L467 724L445 682Z"))
    place("W", 706, ink("M50 702L196 11L354 564L501 11L655 702", 44, 10),
          shape("M23 708L77 708L58 673ZM628 703L678 724L656 680Z"))
    place("X", 486, ink("M69 701L414 17M409 702L68 15", 40, 10),
          shape("M42 706L92 706L78 679ZM393 15L439 15L410 46Z"))
    place("Y", 484, ink("M49 701L243 350L434 702", 43, 10), stem(243, 16, 345, 43))
    place("Z", 451, line(62, 701, 384, 701), ink("M385 701L65 17", 43, 10),
          line(65, 17, 390, 17), shape("M51 701L48 658L37 721ZM375 17L405 56L400-2Z"))

    place("a", 340, bowl(69, 244, 10, 474, 41), stem(250, 16, 452, 37))
    place("b", 339, stem(82, 16, 719, 39), bowl(87, 256, 11, 474, 41))
    place("c", 294, ink("M240 422L167 475Q67 409 67 337L67 140Q67 75 158 12L242 68", 42, 10),
          shape("M217 444L256 424L234 394Z"))
    place("d", 341, bowl(70, 250, 10, 474, 41), stem(256, 16, 719, 38))
    place("e", 309, ink("M240 81L159 11Q68 69 68 138L68 335Q68 415 162 474"
              "Q238 424 248 357L75 262", 42, 10),
          shape("M226 103L254 84L236 62Z"))
    place("f", 238, ink("M98-110L98 569Q99 657 169 713L224 675", 40, 10),
          line(40, 436, 202, 436, 10), shape("M200 694L239 677L220 651Z"))
    place("g", 341, bowl(70, 249, 11, 474, 41), stem(255, 15, 452, 36),
          ink("M255 60L255-64Q251-151 157-201Q88-193 53-159", 38, 10),
          shape("M47-159L74-135L74-177Z"))
    place("h", 359, stem(81, 16, 719, 39), arch(86, 273, 35),
          shape("M254 44L273 10L310 38L288 60Z"))
    place("i", 185, stem(88, 16, 452, 38), shape("M67 594L88 617L111 594L88 571Z"))
    place("j", 196, stem(111, -85, 452, 38),
          ink("M111-63Q110-159 40-191L12-170", 34, 10),
          shape("M89 594L111 617L133 594L111 571Z"))
    place("k", 330, stem(81, 16, 719, 39), ink("M271 465L96 227L278 22", 35, 10),
          shape("M254 465L292 487L280 440ZM261 24L300 14L276 47Z"))
    place("l", 185, stem(86, 16, 719, 39))
    place("m", 538, stem(80, 16, 452, 39), arch(86, 265, 35), arch(269, 453, 35),
          shape("M247 44L266 11L302 38L281 61ZM434 44L453 11L490 38L468 61Z"))
    place("n", 358, stem(80, 16, 452, 39), arch(86, 272, 35),
          shape("M254 44L273 11L310 38L288 61Z"))
    place("o", 327, bowl(69, 256, 9, 474, 43))
    place("p", 340, stem(81, -195, 452, 39), bowl(87, 256, 11, 474, 41))
    place("q", 340, bowl(69, 249, 11, 474, 41), stem(255, -195, 452, 38))
    place("r", 262, stem(80, 16, 452, 39),
          ink("M87 393L158 471L224 421", 37, 10), shape("M198 443L243 424L222 395Z"))
    place("s", 282, ink("M225 428L164 474Q83 426 83 366Q83 320 154 257"
              "Q228 196 220 130Q214 65 141 11L55 66", 41, 10),
          shape("M207 448L241 429L220 402ZM46 67L67 90L76 50Z"))
    place("t", 245, stem(101, 75, 624, 37), line(43, 436, 208, 436, 10),
          ink("M103 102Q104 42 153 13L211 52", 34, 10))
    place("u", 359, stem(80, 78, 452, 39), stem(273, 16, 452, 37),
          ink("M81 101Q102 51 156 10L268 95", 39, 10))
    place("v", 319, ink("M61 465L153 9Q249 91 252 184L252 444", 42, 10),
          shape("M34 464L61 489L88 460L65 438ZM230 444L252 476L278 447L253 425Z"))
    place("w", 496, ink("M59 465L151 9L251 321L327 9Q424 88 426 190L426 444", 42, 10),
          shape("M32 464L59 489L86 460L63 438ZM404 444L426 476L452 447L427 425Z"))
    place("x", 314, ink("M66 463L252 18M248 463L61 15", 35, 10),
          shape("M43 466L79 482L78 449ZM235 15L270 15L247 40Z"))
    place("y", 328, ink("M59 465L157 12M263 459L179 3Q139-130 62-192L29-171", 39, 10),
          shape("M35 465L59 489L85 460L63 438ZM241 462L267 481L283 457Z"))
    place("z", 299, line(61, 460, 240, 460), ink("M240 459L65 24", 36, 10),
          line(65, 24, 245, 24), shape("M49 460L46 424L39 476ZM232 23L261 52L253 8Z"))


def numbers() -> None:
    place("0", 375, bowl(72, 300, 9, 695, 42))
    place("1", 264, stem(150, 16, 679, 39), ink("M56 566L148 693", 18, 11))
    place("2", 374, ink("M66 584Q84 688 186 693Q302 686 304 570Q308 492 233 382L67 20", 42, 10),
          line(67, 20, 308, 20), shape("M292 21L323 57L317 5Z"))
    place("3", 370, ink("M69 623Q149 724 251 674Q319 636 298 521Q280 423 161 359"
              "Q301 357 308 209Q319 89 221 25Q138-20 61 51", 43, 11))
    place("4", 386, ink("M276 19L276 693L56 241L335 241", 40, 10))
    place("5", 367, line(82, 683, 299, 683), ink("M82 683L71 386Q168 433 246 365"
              "Q324 295 298 161Q282 59 186 19Q118-10 57 45", 43, 10))
    place("6", 376, ink("M302 666Q223 737 139 640Q70 555 69 333L69 176"
              "Q70 65 181 11Q289 53 303 180L303 278Q295 390 205 416L74 326", 43, 11))
    place("7", 361, line(62, 684, 305, 684), ink("M305 684L119 11", 44, 10),
          line(116, 341, 265, 341, 10))
    place("8", 375, ink("M185 693Q80 651 80 557Q77 463 185 368Q307 281 305 178"
              "Q305 65 185 10Q67 59 67 174Q70 280 185 368Q292 466 292 557"
              "Q292 652 185 693Z", 43, 10))
    place("9", 376, translated("6", dx=375, dy=704, sx=-1, sy=-1))


def punctuation() -> None:
    place(" ", 210)
    place(".", 155, dot(78, 26, 21))
    place(",", 157, dot(80, 29, 21), ink("M95 23Q92-28 47-68", 13, 10))
    place(":", 158, dot(79, 26, 20), dot(79, 353, 20))
    place(";", 160, translated(","), dot(80, 353, 20))
    place("!", 184, shape("M67 705L117 705L101 192L82 174Z"), dot(91, 26, 22))
    place("?", 310, ink("M57 594Q59 686 152 702Q251 705 255 602"
              "Q261 537 193 456Q156 412 151 343L151 190", 37, 10), dot(151, 26, 22))
    place("'", 112, shape("M49 710L82 710L71 544L52 526Z"))
    place('"', 190, translated("'"), translated("'", dx=76))
    place("-", 290, line(55, 278, 235, 278, 13))
    place("_", 430, line(32, -64, 399, -64, 12))
    place("/", 331, ink("M42-62L286 735", 17, 11))
    place("\\", 331, ink("M42 735L286-62", 17, 11))
    place("(", 246, ink("M195 758Q72 549 72 339Q72 98 195-98", 27, 10))
    place(")", 246, translated("(", dx=246, sx=-1))
    place("[", 235, ink("M187 756L75 756L75-98L187-98", 21, 11))
    place("]", 235, translated("[", dx=235, sx=-1))
    place("{", 271, ink("M219 756Q118 756 118 654L118 449Q119 363 53 335"
              "Q118 313 118 222L118 4Q118-98 219-98", 24, 10))
    place("}", 271, translated("{", dx=271, sx=-1))
    place("+", 431, line(55, 328, 375, 328, 13), line(215, 168, 215, 488, 13))
    place("=", 431, line(55, 260, 375, 260, 13), line(55, 398, 375, 398, 13))
    place("<", 379, ink("M317 521L62 324L317 128", 15, 12))
    place(">", 379, translated("<", dx=379, sx=-1))
    place("^", 358, ink("M69 474L179 708L289 474", 15, 11))
    place("`", 235, shape("M58 727L94 747L176 593L159 583Z"))
    place("~", 410, ink("M54 293Q128 403 204 332Q280 261 357 368", 16, 11))
    place("|", 177, line(88, -118, 88, 747, 14))
    place("*", 320, *(line(160, 565, x, y, 13) for x, y in ((160,704),(293,609),(242,451),(78,451),(27,609))))
    place("#", 490, line(122, -23, 233, 706, 16), line(275, -23, 386, 706, 16),
          line(64, 223, 410, 223, 12), line(89, 467, 438, 467, 12))
    place("%", 593, translated("0", dx=9, dy=397, sx=.49, sy=.44),
          translated("0", dx=382, dy=5, sx=.49, sy=.44), ink("M102-8L488 710", 15, 11))
    place("&", 515, ink("M427 37L157 427Q101 508 128 602Q154 696 228 705"
              "Q316 664 309 588Q302 516 203 395Q58 236 78 139Q94 41 192 13"
              "Q312-12 417 210L452 304", 40, 11), line(353, 305, 482, 305, 10))
    place("@", 649, ink("M401 129Q441 87 490 134Q574 221 569 382Q565 567 415 654"
              "Q241 743 111 597Q30 508 43 305Q54 80 237 12Q374-32 490 35", 24, 11),
          bowl(211, 367, 149, 492, 32), ink("M375 484L375 169Q375 128 401 129", 31, 10))
    place("$", 434, translated("S", dx=-7, sx=.98), line(214, -75, 214, 784, 12))


def accent(mark: str, x: float, y: float) -> pathops.Path:
    if mark == "\u0300":
        return shape(f"M{x-70} {y+104}L{x-39} {y+118}L{x+44} {y+4}L{x+30} {y-6}Z")
    if mark == "\u0301":
        return shape(f"M{x+38} {y+119}L{x+71} {y+104}L{x-30} {y-6}L{x-43} {y+4}Z")
    if mark in ("\u0302", "\u030c"):
        path = ink("M-81 0L0 100L81 0", 16, 10)
        return path.transform(scaleY=-1 if mark == "\u030c" else 1,
                              translateX=x, translateY=y + (100 if mark == "\u030c" else 0))
    if mark == "\u0303":
        return ink(f"M{x-85} {y+21}Q{x-42} {y+105} {x} {y+58}Q{x+42} {y+11} {x+85} {y+95}", 18, 11)
    if mark == "\u0304":
        return line(x-84, y+55, x+84, y+55, 13)
    if mark == "\u0306":
        return ink(f"M{x-82} {y+98}Q{x} {y-35} {x+82} {y+98}", 19, 11)
    if mark == "\u0307":
        return dot(x, y+55, 18)
    if mark == "\u0308":
        return union(dot(x-56, y+55, 18), dot(x+56, y+55, 18))
    if mark == "\u030a":
        return pathops.op(dot(x, y+65, 49), dot(x, y+65, 34), pathops.PathOp.DIFFERENCE)
    if mark == "\u030b":
        return union(accent("\u0301", x-48, y), accent("\u0301", x+48, y))
    if mark == "\u0327":
        return ink(f"M{x+10}-6L{x-18}-58Q{x+69}-66 {x+30}-124Q{x+9}-152 {x-42}-133", 18, 10)
    if mark == "\u0328":
        return ink(f"M{x+39} 8Q{x-63}-81 {x-5}-137Q{x+20}-151 {x+55}-131", 23, 10)
    if mark == "\u0326":
        return union(dot(x+6, -76, 16), ink(f"M{x+18}-82Q{x+14}-123 {x-18}-145", 13, 10))
    raise ValueError(f"Unsupported combining accent U+{ord(mark):04X}")


def extended() -> None:
    place("\u00a0", 210)
    place("¡", 184, translated("!", dx=184, dy=470, sx=-1, sy=-1))
    place("¿", 310, translated("?", dx=310, dy=470, sx=-1, sy=-1))
    place("Æ", 691, translated("A", sx=.89), translated("E", dx=301, sx=.84))
    place("æ", 521, translated("a", sx=.9), translated("e", dx=243, sx=.9))
    place("Ð", 509, translated("D"), line(24, 352, 206, 352, 13))
    place("ð", 336, translated("o", dx=4), ink("M102 714Q286 651 257 430", 37, 10),
          line(111, 580, 271, 687, 12))
    place("Ø", 522, translated("O"), line(95, -18, 428, 736, 13))
    place("ø", 327, translated("o"), line(57, -27, 273, 502, 12))
    place("Þ", 468, stem(88, 16, 692, 43),
          ink("M93 556Q234 619 351 520Q410 457 379 345Q325 212 111 230", 45, 11))
    place("þ", 340, translated("p"), stem(81, 16, 719, 39))
    place("ß", 361, ink("M83 15L83 539Q84 664 182 715Q282 681 285 585Q288 510 189 410"
              "Q287 371 290 250Q300 111 211 16L139 49", 40, 10))
    place("Đ", 509, translated("Ð"))
    place("đ", 341, translated("d"), line(158, 591, 327, 591, 12))
    place("Ħ", 512, translated("H"), line(25, 563, 484, 563, 12))
    place("ħ", 359, translated("h"), line(24, 591, 180, 591, 11))
    place("ı", 185, stem(88, 16, 452, 38))
    place("Ĳ", 551, translated("I"), translated("J", dx=201))
    place("ĳ", 366, translated("i"), translated("j", dx=170))
    place("ĸ", 330, stem(81, 16, 452, 39), ink("M271 465L96 227L278 22", 35, 10))
    place("Ŀ", 445, translated("L"), dot(325, 396, 19))
    place("ŀ", 265, translated("l"), dot(217, 396, 19))
    place("Ł", 410, translated("L"), line(32, 287, 223, 451, 13))
    place("ł", 201, translated("l"), line(24, 311, 172, 444, 12))
    place("Ŋ", 529, translated("N"), ink("M439 97L439-67Q435-163 347-193L308-161", 38, 10))
    place("ŋ", 358, translated("n"), ink("M273 75L273-66Q270-154 180-197L142-166", 37, 10))
    place("ŉ", 444, translated("n", dx=87), translated("’", dx=-35) if "’" in GLYPHS else
          union(dot(53, 573, 16), ink("M65 570Q63 528 31 493", 12, 10)))
    place("Œ", 714, translated("O", sx=.9), translated("E", dx=333, sx=.84))
    place("œ", 539, translated("o", sx=.92), translated("e", dx=255, sx=.92))
    place("Ŧ", 448, translated("T"), line(100, 392, 347, 392, 13))
    place("ŧ", 245, translated("t"), line(42, 269, 207, 269, 11))
    place("ſ", 238, ink("M98 15L98 569Q99 657 169 713L224 675", 40, 10),
          line(40, 436, 165, 436, 10))
    # Romanian comma-below letters have their own Unicode assignments, distinct
    # from the S/T with cedilla used in other languages.
    for character, base in (("Ș", "S"), ("ș", "s"), ("Ț", "T"), ("ț", "t")):
        path, width = GLYPHS[base]
        place(character, width, path, accent("\u0326", width / 2, 0))
    # Decomposed accents reuse our own original base drawings.
    for code in range(0xA0, 0x180):
        char = chr(code)
        decomposition = unicodedata.normalize("NFD", char)
        if char in GLYPHS or len(decomposition) < 2:
            continue
        base, *marks = decomposition
        if base not in GLYPHS:
            continue
        original = "ı" if base == "i" else base
        path, width = GLYPHS[original]
        height = CAP + 52 if base.isupper() else XHEIGHT + 54
        # Tall lowercase l, h, d, k, t carry marks above their ascender.
        if base in "bdfhklt":
            height = 771
        center = width / 2
        if base in "Ll":
            center = 86
        if marks == ["\u0327"] and base in "GgKkLlNnRr":
            # Latvian forms use comma-shaped marks despite Unicode's historical
            # "cedilla" names. The turned comma belongs above a descending g.
            comma = accent("\u0326", 0, 0)
            if base == "g":
                comma = comma.transform(scaleX=-1, scaleY=-1,
                                        translateX=center, translateY=500)
            else:
                comma = comma.transform(translateX=center)
            place(char, width, path, comma)
        elif marks == ["\u030c"] and base in "dlt":
            # Traditional apostrophe-shaped caron avoids an ascender collision.
            top = 668 if base != "t" else 580
            mark_path = translated("'", dx=width-21, dy=top-710, sx=.72)
            place(char, width+43, path, mark_path)
        else:
            place(char, width, path, *(accent(mark, center, height) for mark in marks))

    place("¢", 294, translated("c"), line(158, -62, 158, 553, 12))
    place("£", 419, ink("M356 643Q315 719 231 694Q135 663 139 533L139 158Q137 82 62 18"
              "Q183 71 338 18L373 61", 40, 11), line(65, 341, 297, 341, 12))
    place("¤", 452, bowl(106, 346, 171, 535, 30),
          *(line(a, b, c, d, 16) for a,b,c,d in ((56,116,115,185),(337,524,397,593),(55,592,115,524),(337,185,397,116))))
    place("¥", 484, translated("Y"), line(97, 311, 389, 311, 12), line(97, 213, 389, 213, 12))
    place("¦", 177, line(88, 442, 88, 747, 14), line(88, -118, 88, 249, 14))
    place("§", 368, ink("M295 634Q233 739 150 682Q78 637 121 540L258 333"
              "Q338 212 241 147Q173 102 108 169Q42 245 105 323Q153 378 231 354"
              "M112 171Q148 98 218 17Q253-50 184-94Q109-145 59-61", 35, 10))
    place("¨", 254, accent("\u0308", 127, 550))
    place("©", 728, bowl(58, 670, -10, 721, 18), translated("C", dx=199, dy=159, sx=.61, sy=.61))
    place("ª", 225, translated("a", dx=12, dy=393, sx=.59, sy=.59), line(40, 366, 187, 366, 10))
    place("«", 409, ink("M202 463L63 284L202 106M344 463L205 284L344 106", 17, 10))
    place("¬", 431, line(55, 398, 375, 398, 13), line(375, 398, 375, 216, 13))
    place("\u00ad", 290, translated("-"))
    place("®", 728, bowl(58, 670, -10, 721, 18), translated("R", dx=206, dy=159, sx=.61, sy=.61))
    place("¯", 254, line(44, 610, 210, 610, 13))
    place("°", 285, pathops.op(dot(142, 603, 85), dot(142, 603, 69), pathops.PathOp.DIFFERENCE))
    place("±", 431, translated("+", dy=78), line(55, 127, 375, 127, 13))
    place("²", 255, translated("2", dx=9, dy=380, sx=.62, sy=.62))
    place("³", 255, translated("3", dx=9, dy=380, sx=.62, sy=.62))
    place("´", 254, accent("\u0301", 127, 550))
    place("µ", 359, translated("u"), ink("M80 124L80-192", 38, 10))
    place("¶", 484, shape("M292 711L292 203Q52 198 52 461Q52 711 292 711Z"),
          line(291, -105, 291, 711, 18), line(385, -105, 385, 711, 18), line(291, 711, 439, 711, 13))
    place("·", 155, dot(78, 291, 19))
    place("¸", 254, accent("\u0327", 127, 0))
    place("¹", 207, translated("1", dx=15, dy=380, sx=.62, sy=.62))
    place("º", 225, translated("o", dx=15, dy=393, sx=.59, sy=.59), line(40, 366, 187, 366, 10))
    place("»", 409, translated("«", dx=409, sx=-1))
    for character, numerator, denominator in (("¼", "1", "4"), ("½", "1", "2"), ("¾", "3", "4")):
        place(character, 566, translated(numerator, dx=10, dy=369, sx=.48, sy=.48),
              translated(denominator, dx=354, dy=5, sx=.48, sy=.48), line(134, -4, 430, 714, 13))
    place("×", 431, line(84, 173, 347, 479, 13), line(84, 479, 347, 173, 13))
    place("÷", 431, line(55, 328, 375, 328, 13), dot(215, 478, 18), dot(215, 178, 18))
    place("€", 488, translated("C", dx=17, sx=.93), line(28, 414, 326, 414, 12), line(28, 290, 298, 290, 12))
    place("–", 510, line(45, 278, 465, 278, 12))
    place("—", 870, line(45, 278, 825, 278, 12))
    place("‘", 155, dot(75, 573, 20), ink("M60 576Q64 625 107 670", 12, 10))
    place("’", 155, translated("‘", dx=155, dy=1242, sx=-1, sy=-1))
    place("“", 281, translated("‘"), translated("‘", dx=126))
    place("”", 281, translated("’"), translated("’", dx=126))
    place("•", 240, dot(120, 291, 38))
    place("…", 465, translated("."), translated(".", dx=155), translated(".", dx=310))


KERNING = {
    ("A", "V"): -34, ("A", "W"): -27, ("A", "Y"): -32, ("A", "T"): -25,
    ("V", "A"): -34, ("W", "A"): -27, ("Y", "A"): -32, ("T", "A"): -25,
    ("T", "o"): -31, ("T", "a"): -25, ("T", "e"): -27, ("T", "r"): -15,
    ("V", "o"): -19, ("V", "a"): -19, ("W", "o"): -13, ("Y", "o"): -26,
    ("Y", "a"): -24, ("L", "T"): -24, ("L", "Y"): -25,
    ("r", "."): -14, ("r", ","): -14, ("f", "i"): -10,
}


def glyph_name(character: str) -> str:
    return "space" if character == " " else f"uni{ord(character):04X}"


def build(output: Path) -> None:
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    GLYPHS.clear()
    letters()
    numbers()
    punctuation()
    extended()
    expected = set(map(chr, range(32, 127))) | set(map(chr, range(160, 384)))
    missing = expected - GLYPHS.keys()
    if missing:
        raise ValueError(f"Missing independently drawn glyphs: {sorted(missing)}")

    ufo = ufoLib2.Font()
    ufo.info.familyName = "MZ Vellum Display"
    ufo.info.styleName = "Regular"
    ufo.info.unitsPerEm = EM
    ufo.info.ascender = 940
    ufo.info.descender = -250
    ufo.info.capHeight = CAP
    ufo.info.xHeight = XHEIGHT
    ufo.info.versionMajor = 1
    ufo.info.versionMinor = 100
    ufo.info.copyright = "Copyright 2026 MZ Vellum Project Authors. Original outline design."
    ufo.info.openTypeOS2WeightClass = 400
    ufo.info.openTypeOS2WidthClass = 4
    ufo.info.openTypeOS2Type = []
    ufo.info.openTypeNameLicense = "This Font Software is licensed under the SIL Open Font License, Version 1.1."
    ufo.info.openTypeNameLicenseURL = "https://openfontlicense.org/"
    ufo.info.openTypeHeadCreated = "2026/01/01 00:00:00"
    notdef = ufo.newGlyph(".notdef")
    notdef.width = 500
    shape("M55 0L445 0L445 710L55 710ZM76 22L76 688L424 688L424 22Z").draw(notdef.getPen())
    for character in sorted(GLYPHS, key=ord):
        outline, width = GLYPHS[character]
        glyph = ufo.newGlyph(glyph_name(character))
        glyph.width = width
        glyph.unicodes = [ord(character)]
        outline.draw(glyph.getPen())
    for (left, right), adjustment in KERNING.items():
        ufo.kerning[(glyph_name(left), glyph_name(right))] = adjustment
    features = "languagesystem DFLT dflt;\nlanguagesystem latn dflt;\nfeature kern {\n"
    features += "\n".join(f"pos {glyph_name(a)} {glyph_name(b)} {v};" for (a,b),v in KERNING.items())
    features += "\n} kern;\n"
    ufo.features.text = features
    ufo.glyphOrder = [".notdef"] + [glyph_name(c) for c in sorted(GLYPHS, key=ord)]
    source = output / "MZVellumDisplay-Regular.ufo"
    ufo.save(source, overwrite=True)

    font = FontBuilder(EM, isTTF=True)
    font.setupGlyphOrder(ufo.glyphOrder)
    font.setupCharacterMap({ord(c): glyph_name(c) for c in GLYPHS})
    outlines, metrics = {}, {}
    for name in ufo.glyphOrder:
        pen = TTGlyphPen(None)
        ufo[name].draw(Cu2QuPen(pen, max_err=0.6, reverse_direction=True))
        outlines[name] = pen.glyph()
        bounds = ufo[name].getBounds(ufo.layers.defaultLayer)
        metrics[name] = (int(ufo[name].width), round(bounds[0]) if bounds else 0)
    font.setupGlyf(outlines)
    font.setupHorizontalMetrics(metrics)
    font.setupHorizontalHeader(ascent=940, descent=-250, lineGap=0)
    font.setupNameTable({
        "familyName": "MZ Vellum Display", "styleName": "Regular",
        "uniqueFontIdentifier": "MZTypefaceProject:VellumDisplay:2026:1.100",
        "fullName": "MZ Vellum Display Regular", "psName": "MZVellumDisplay-Regular",
        "version": "Version 1.100", "copyright": ufo.info.copyright,
        "licenseDescription": ufo.info.openTypeNameLicense,
        "licenseInfoURL": ufo.info.openTypeNameLicenseURL,
    })
    font.setupOS2(version=4, sTypoAscender=940, sTypoDescender=-250, sTypoLineGap=0,
                 usWinAscent=940, usWinDescent=250, sxHeight=XHEIGHT, sCapHeight=CAP,
                 usWeightClass=400, usWidthClass=4, fsType=0, fsSelection=0xC0)
    font.setupPost()
    addOpenTypeFeaturesFromString(font.font, features)
    font.font["head"].created = 3849984000
    font.font["head"].modified = 3849984000
    font.font["head"].fontRevision = 1.1
    font.font.recalcTimestamp = False
    target = output / "MZVellumDisplay-Regular.ttf"
    font.save(target)
    web = TTFont(target, recalcTimestamp=False)
    web.flavor = "woff2"
    web.save(output / "MZVellumDisplay-Regular.woff2")
