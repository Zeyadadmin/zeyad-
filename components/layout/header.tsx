"use client"

import Link from 'next/link'
import {
  MessageSquare,
  Radio,
  Search,
  User as UserIcon,
  Bell,
  Menu,
  Shield,
  Package,
  CreditCard,
  ShieldCheck,
  Mail,
  type LucideIcon,
  LogOut,
  LayoutDashboard,
  Bot,
  Share2,
  ShoppingCart,
} from 'lucide-react'
import Logo from './logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { loggedInUserMenu, secondaryUserMenu, driverMenu, adminNotifications } from '@/lib/data'
import { Switch } from '@/components/ui/switch'
import { Label } from '../ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'
import { serviceCategories } from '@/lib/data'
import React from 'react'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { useUser, useDoc, useFirestore, useAuth } from '@/firebase'
import type { UserProfile } from '@/lib/admin-atoms'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { doc, updateDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'

const notificationIcons: { [key: string]: LucideIcon } = {
    order: Package,
    subscription: CreditCard,
    verification: ShieldCheck,
    system: Mail,
    receipt: Mail,
};


const NotificationsMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {adminNotifications.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0">{adminNotifications.length}</Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {adminNotifications.length > 0 ? (
          <DropdownMenuGroup className="max-h-96 overflow-y-auto">
            {adminNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Mail;
              const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: ar });
              return (
                <DropdownMenuItem key={notification.id} className="flex items-start gap-3">
                  <Icon className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="mt-1 text-xs text-blue-500">{timeAgo}</p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ) : (
          <p className='p-4 text-sm text-center text-muted-foreground'>لا توجد إشعارات جديدة.</p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center">
            عرض كل الإشعارات
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const UserMenu = () => {
  const { user, loading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : undefined);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'تم تسجيل الخروج',
        description: 'نأمل أن نراك قريباً!',
      });
      router.push('/');
    } catch (error) {
      console.error('Logout Error:', error);
      toast({
        variant: 'destructive',
        title: 'حدث خطأ أثناء تسجيل الخروج',
      });
    }
  };

  const handleStatusChange = async (checked: boolean) => {
    if (!userProfile) return;
    const userRef = doc(firestore, 'users', userProfile.uid);
    try {
      await updateDoc(userRef, { online: checked });
      toast({
        title: `لقد أصبحت الآن ${checked ? 'متصل' : 'غير متصل'}`,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        variant: 'destructive',
        title: 'فشل تحديث الحالة',
        description: 'حدث خطأ أثناء محاولة تحديث حالتك. يرجى المحاولة مرة أخرى.',
      });
    }
  };

  if (loading || (user && profileLoading)) {
    return (
      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
        <Avatar className="h-10 w-10 animate-pulse bg-muted"></Avatar>
      </Button>
    );
  }

  if (!user || !userProfile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback><UserIcon /></AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuItem asChild>
            <Link href="/login">تسجيل الدخول</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/signup">إنشاء حساب</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  const isAdmin = userProfile.role === 'admin';
  const isDriver = userProfile.role === 'driver' || userProfile.role === 'delivery-driver';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userProfile.photoURL ?? undefined} alt={userProfile.displayName} />
            <AvatarFallback>{userProfile.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userProfile.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userProfile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href='/dashboard' className="flex items-center gap-2 cursor-pointer">
              <LayoutDashboard className="h-4 w-4" />
              <span>لوحة التحكم</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href='/dashboard?tab=my-orders' className="flex items-center gap-2 cursor-pointer">
              <ShoppingCart className="h-4 w-4" />
              <span>طلباتي</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href='/smart-assistant' className="flex items-center gap-2 cursor-pointer">
              <Bot className="h-4 w-4" />
              <span>المساعد الذكي</span>
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
             <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4" />
                <span>لوحة تحكم المسؤول</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {isDriver && (
            <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div className="flex items-center justify-between w-full">
                        <Label htmlFor="driver-status-online" className="flex items-center gap-2 cursor-pointer">
                            <Radio className="h-4 w-4" />
                            <span>متصل</span>
                        </Label>
                        <Switch
                            id="driver-status-online"
                            checked={userProfile.online}
                            onCheckedChange={handleStatusChange}
                        />
                    </div>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="#" className="flex items-center gap-2 cursor-pointer">
                <Share2 className="h-4 w-4" />
                <span>مشاركة التطبيق</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


const MobileNav = () => {
    const { user } = useUser();
    const [open, setOpen] = React.useState(false);
  
    return (
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-4">
                 {user ? (
                    <div className='flex flex-col h-full'>
                        <SheetHeader className="text-right mb-4">
                             <SheetTitle>القائمة الرئيسية</SheetTitle>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto space-y-2">
                            {[...loggedInUserMenu, ...secondaryUserMenu].map(item => (
                               <Button key={item.label} variant="ghost" className="w-full justify-start gap-2" asChild onClick={() => setOpen(false)}>
                                 <Link href={item.href}>
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                 </Link>
                               </Button>
                            ))}
                            
                             <div className="flex items-center justify-between w-full p-2">
                                <Label htmlFor="driver-status-mobile" className="flex items-center gap-2 cursor-pointer">
                                    <Switch id="driver-status-mobile" />
                                    <span>متصل</span>
                                </Label>
                            </div>
                        </div>
                        
                        <Separator className="my-4"/>

                         <div className="flex-1 overflow-y-auto space-y-1">
                            <p className='text-sm font-semibold p-2'>جميع الخدمات</p>
                            {serviceCategories.map((category) => (
                                <Button key={category.name} variant="ghost" className="w-full justify-start gap-2" asChild onClick={() => setOpen(false)}>
                                    <Link href={category.href}>
                                        <category.icon className="h-4 w-4" />
                                        {category.name}
                                    </Link>
                                </Button>
                            ))}
                         </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                       <Button asChild onClick={() => setOpen(false)}><Link href="/login">تسجيل الدخول</Link></Button>
                       <Button asChild variant="outline" onClick={() => setOpen(false)}><Link href="/signup">إنشاء حساب</Link></Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
      </div>
    );
  };


export default function Header() {
  const { user, loading } = useUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <MobileNav />
          <div className="hidden md:flex">
            <Logo />
          </div>
        </div>

        <div className="flex flex-1 justify-center md:hidden">
            <Logo />
        </div>

        <div className="flex items-center gap-2">
          {!loading && (
            user ? (
                <>
                <Button variant="ghost" size="icon" className='hidden md:inline-flex'>
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/chat">
                        <MessageSquare className="h-5 w-5" />
                        <span className="sr-only">Chat</span>
                    </Link>
                </Button>
                <NotificationsMenu />
                <UserMenu />
                </>
            ) : (
                <>
                <div className="hidden md:flex items-center gap-2">
                    <Button asChild variant="ghost">
                    <Link href="/login">تسجيل الدخول</Link>
                    </Button>
                    <Button asChild>
                    <Link href="/signup">إنشاء حساب</Link>
                    </Button>
                </div>
                </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
