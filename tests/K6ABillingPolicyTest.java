package com.seamenpool.billing;
public final class K6ABillingPolicyTest {
 public static void main(String[] args){
  if(PurchaseTestPolicy.enabled(true)||PurchaseTestPolicy.enabled(false))throw new AssertionError("supplied gate must be OFF");
  if(PurchaseTestPolicy.allows(false,true)||PurchaseTestPolicy.allows(false,false)||PurchaseTestPolicy.allows(true,false))throw new AssertionError("release/default must reject");
  if(!PurchaseTestPolicy.allows(true,true))throw new AssertionError("explicitly opted-in debug is the only allowed test path");
  SupporterBillingCore.Offer offer=new SupporterBillingCore.Offer(SupporterBillingCore.PRODUCT,SupporterBillingCore.OPTION,"€2,49",new Object(),"EUR",2490000);
  if(!"EUR".equals(offer.currency)||offer.priceMicros!=2490000||!"€2,49".equals(offer.price))throw new AssertionError("Play price/currency must be preserved");
  System.out.println("PASS K6A debug-only policy truth table, supplied switch OFF, release rejects even requested=true; exact Play price/currency fields");
 }
}
