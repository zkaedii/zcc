MEMORY
{
    FLASH (rx)  : ORIGIN = 0x10000000, LENGTH = 2048K
    SRAM  (rwx) : ORIGIN = 0x20000000, LENGTH = 264K
}

ENTRY(_reset)

SECTIONS
{
    .boot2 0x10000000 : {
        KEEP(*(.boot2))
    } > FLASH

    .vectors : {
        KEEP(*(.vectors))
    } > FLASH

    .text : {
        *(.text*)
        *(.rodata*)
        . = ALIGN(4);
    } > FLASH

    .data : {
        *(.data*)
        . = ALIGN(4);
    } > SRAM AT > FLASH

    .bss (NOLOAD) : {
        *(.bss*)
        *(COMMON)
        . = ALIGN(4);
    } > SRAM
}
